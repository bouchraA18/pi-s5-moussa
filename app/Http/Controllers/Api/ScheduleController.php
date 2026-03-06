<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Schedule;
use Illuminate\Http\Request;
use Carbon\Carbon;

class ScheduleController extends Controller
{
    public function index(Request $request)
    {
        $query = Schedule::with(['teacher', 'matiere']);

        if ($request->has('enseignant_id')) {
            $query->where('enseignant_id', $request->enseignant_id);
        }

        if ($request->has('matiere_id')) {
            $query->where('matiere_id', $request->matiere_id);
        }

        return $query->get();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'enseignant_id' => 'required|exists:users,id',
            'matiere_id' => 'required|exists:matieres,id',
            'jour_semaine' => 'required|integer|between:1,7',
            'heure_debut' => 'required',
            'heure_fin' => 'required',
            'type_seance' => 'required|string',
            'groupe' => 'nullable|string',
            'salle' => 'nullable|string',
            'annee_scolaire_id' => 'required|exists:annee_scolaires,id',
        ]);

        return Schedule::create($validated);
    }

    public function show($id)
    {
        return Schedule::with(['teacher', 'matiere'])->findOrFail($id);
    }

    public function update(Request $request, $id)
    {
        $schedule = Schedule::findOrFail($id);
        $validated = $request->validate([
            'enseignant_id' => 'sometimes|exists:users,id',
            'matiere_id' => 'sometimes|exists:matieres,id',
            'jour_semaine' => 'sometimes|integer|between:1,7',
            'heure_debut' => 'sometimes',
            'heure_fin' => 'sometimes',
            'type_seance' => 'sometimes|string',
            'groupe' => 'nullable|string',
            'salle' => 'nullable|string',
            'annee_scolaire_id' => 'sometimes|exists:annee_scolaires,id',
        ]);

        $schedule->update($validated);
        return $schedule;
    }

    public function destroy($id)
    {
        $schedule = Schedule::findOrFail($id);
        $schedule->delete();
        return response()->noContent();
    }

    public function getTodaySchedules(Request $request)
    {
        $user = $request->user();
        $dayOfWeek = Carbon::now()->dayOfWeek; 
        
        // Carbon: 0 (Sunday) - 6 (Saturday). My DB: 1 (Monday) - 7 (Sunday).
        $laravelDayToDbDay = [
            0 => 7, // Sun
            1 => 1, // Mon
            2 => 2, // Tue
            3 => 3, // Wed
            4 => 4, // Thu
            5 => 5, // Fri
            6 => 6, // Sat
        ];
        
        $dbDay = $laravelDayToDbDay[$dayOfWeek];

        return Schedule::where('enseignant_id', $user->id)
            ->where('jour_semaine', $dbDay)
            ->with('matiere')
            ->get();
    }

    public function import(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:csv,txt'
        ]);

        $path = $request->file('file')->getRealPath();
        $file = fopen($path, 'r');
        $headers = fgetcsv($file); // ["enseignant_email", "matiere_code", "jour_semaine", "heure_debut", "heure_fin", "type_seance", "groupe", "salle", "annee_scolaire_id"]

        // Minimal check on headers
        if (!$headers || !in_array('enseignant_email', $headers)) {
            fclose($file);
            return response()->json(['message' => 'Format de CSV invalide. Headers attendus manquant.'], 400);
        }

        $imported = 0;
        $errors = [];
        $row = 2; // because row 1 is headers

        // Pre-fetch all needed references to avoid querying in loop
        $usersByEmail = \App\Models\User::where('role', 'ENSEIGNANT')->pluck('id', 'email')->toArray();
        $matieresByCode = \App\Models\Matiere::pluck('id', 'code')->toArray();

        try {
            while (($data = fgetcsv($file)) !== false) {
                // associate keys with data
                // skip if empty line
                if (count($data) < count($headers)) continue;

                $rowAssoc = array_combine($headers, $data);

                // Default trim
                $email = trim($rowAssoc['enseignant_email'] ?? '');
                $matiereCode = trim($rowAssoc['matiere_code'] ?? '');
                $jourSemaine = (int) trim($rowAssoc['jour_semaine'] ?? 0);
                $heureDebut = trim($rowAssoc['heure_debut'] ?? '');
                $heureFin = trim($rowAssoc['heure_fin'] ?? '');
                $typeSeance = strtoupper(trim($rowAssoc['type_seance'] ?? 'CM'));
                $groupe = trim($rowAssoc['groupe'] ?? '');
                $salle = trim($rowAssoc['salle'] ?? '');
                $anneeScolaireId = (int) trim($rowAssoc['annee_scolaire_id'] ?? 1);

                if (!isset($usersByEmail[$email])) {
                     $errors[] = "Ligne $row: Enseignant introuvable ($email)";
                     $row++;
                     continue;
                }

                if (!isset($matieresByCode[$matiereCode])) {
                     $errors[] = "Ligne $row: Matière non trouvée ($matiereCode)";
                     $row++;
                     continue;
                }

                if ($jourSemaine < 1 || $jourSemaine > 7) {
                     $errors[] = "Ligne $row: Jour semaine invalide ($jourSemaine)";
                     $row++;
                     continue;
                }

                // Check if already exists to prevent duplicates
                $exists = Schedule::where('enseignant_id', $usersByEmail[$email])
                    ->where('matiere_id', $matieresByCode[$matiereCode])
                    ->where('jour_semaine', $jourSemaine)
                    ->where('heure_debut', $heureDebut)
                    ->exists();

                if (!$exists) {
                    Schedule::create([
                        'enseignant_id' => $usersByEmail[$email],
                        'matiere_id' => $matieresByCode[$matiereCode],
                        'jour_semaine' => $jourSemaine,
                        'heure_debut' => $heureDebut,
                        'heure_fin' => $heureFin,
                        'type_seance' => $typeSeance,
                        'groupe' => empty($groupe) ? null : $groupe,
                        'salle' => empty($salle) ? null : $salle,
                        'annee_scolaire_id' => $anneeScolaireId,
                    ]);
                    $imported++;
                }
                
                $row++;
            }
            fclose($file);
        } catch (\Exception $e) {
            fclose($file);
            return response()->json(['message' => 'Erreur lors du traitement du fichier.', 'error' => $e->getMessage()], 500);
        }

        return response()->json([
            'message' => "Importation terminée. $imported créneaux ajoutés.",
            'imported' => $imported,
            'errors' => $errors
        ]);
    }
}

