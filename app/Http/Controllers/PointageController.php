<?php

namespace App\Http\Controllers;

use App\Models\Session;
use App\Models\User;
use App\Notifications\NewSessionPointed;
use App\Notifications\SessionStatusUpdated;
use App\Services\ExpoPushService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Notification;
use Illuminate\Validation\Rule;

class PointageController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        $sessions = Session::with('matiere')
            ->where('enseignant_id', $user->id)
            ->orderBy('date', 'desc')
            ->get();
            
        return response()->json($sessions);
    }

    public function store(Request $request)
    {
        $user = Auth::user();
        if (!$user || $user->role !== 'ENSEIGNANT') {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $request->validate([
            'matiere_id' => 'required|exists:matieres,id',
            'date' => 'required|date',
            'heure_debut' => ['required', 'date_format:H:i'],
            'heure_fin' => ['required', 'date_format:H:i', 'after:heure_debut'],
            'type_seance' => 'required|in:CM,TD,TP',
            'annee_scolaire_id' => 'required|exists:annee_scolaires,id',
            'preuve_photo' => 'nullable|image|max:5120', // max 5MB
        ]);

        $matiereId = (int) $request->matiere_id;
        $isAssigned = $user->matieres()->whereKey($matiereId)->exists() || 
                      $user->schedules()->where('matiere_id', $matiereId)->exists();

        if (!$isAssigned) {
            return response()->json(['message' => "Matière non assignée à cet enseignant."], 403);
        }
        // Anti-doublon check — normalize to H:i:s to match MySQL time format
        $heureDebut = date('H:i:s', strtotime($request->heure_debut));
        $heureFin   = date('H:i:s', strtotime($request->heure_fin));

        $exists = Session::where('enseignant_id', Auth::id())
            ->where('matiere_id', $matiereId)
            ->where('date', $request->date)
            ->whereTime('heure_debut', '>=', substr($heureDebut, 0, 5) . ':00')
            ->whereTime('heure_debut', '<=', substr($heureDebut, 0, 5) . ':59')
            ->whereTime('heure_fin', '>=', substr($heureFin, 0, 5) . ':00')
            ->whereTime('heure_fin', '<=', substr($heureFin, 0, 5) . ':59')
            ->exists();

        if ($exists) {
            return response()->json(['message' => "Cette séance a déjà été pointée pour ce créneau."], 422);
        }

        // Basic duration calculation (can be improved)
        $start = strtotime($request->heure_debut);
        $end = strtotime($request->heure_fin);
        $duree = ($end - $start) / 3600;

        // Handle file upload
        $photoPath = null;
        if ($request->hasFile('preuve_photo')) {
            $photoPath = $request->file('preuve_photo')->store('preuves', 'public');
        }

        $session = Session::create([
            'enseignant_id' => Auth::id(),
            'matiere_id' => $matiereId,
            'annee_scolaire_id' => $request->annee_scolaire_id,
            'date' => $request->date,
            'heure_debut' => $request->heure_debut,
            'heure_fin' => $request->heure_fin,
            'duree' => $duree,
            'type_seance' => $request->type_seance,
            'statut' => 'EN_ATTENTE',
            'preuve_photo' => $photoPath,
        ]);

        $session->load(['teacher', 'matiere']);

        // Notify admin + agent scolarité
        $agents = User::whereIn('role', ['AGENT_SCOLARITE', 'ADMINISTRATEUR'])->get();
        Notification::send($agents, new NewSessionPointed($session));
        app(ExpoPushService::class)->sendToUsers(
            $agents,
            'Nouvelle séance à valider',
            ($session->teacher->name ?? 'Un enseignant') . ' a pointé une séance.',
            [
                'type' => 'new_session',
                'session_id' => $session->id,
            ]
        );

        return response()->json($session, 201);
    }

    public function update(Request $request, $id)
    {
        $session = Session::findOrFail($id);

        // Check if user is the teacher of this session
        if ($session->enseignant_id !== Auth::id()) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        // Check if session is still pending
        if ($session->statut !== 'EN_ATTENTE') {
            return response()->json(['message' => 'Impossible de modifier une séance déjà validée ou rejetée'], 422);
        }

        $request->validate([
            'matiere_id' => 'required|exists:matieres,id',
            'date' => 'required|date',
            'heure_debut' => ['required', 'date_format:H:i'],
            'heure_fin' => ['required', 'date_format:H:i', 'after:heure_debut'],
            'type_seance' => 'required|in:CM,TD,TP',
        ]);

        $user = Auth::user();
        $matiereId = (int) $request->matiere_id;
        if (!$user || $user->role !== 'ENSEIGNANT') {
            return response()->json(['message' => 'Non autorisé'], 403);
        }
        
        $isAssigned = $user->matieres()->whereKey($matiereId)->exists() || 
                      $user->schedules()->where('matiere_id', $matiereId)->exists();

        if (!$isAssigned) {
            return response()->json(['message' => "Matière non assignée à cet enseignant."], 403);
        }
        $start = strtotime($request->heure_debut);
        $end = strtotime($request->heure_fin);
        $duree = ($end - $start) / 3600;

        $session->update([
            'matiere_id' => $matiereId,
            'date' => $request->date,
            'heure_debut' => $request->heure_debut,
            'heure_fin' => $request->heure_fin,
            'duree' => $duree,
            'type_seance' => $request->type_seance,
        ]);

        return response()->json($session);
    }

    public function destroy($id)
    {
        $session = Session::findOrFail($id);

        // Check if user is the teacher of this session
        if ($session->enseignant_id !== Auth::id()) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        // Check if session is still pending
        if ($session->statut !== 'EN_ATTENTE') {
            return response()->json(['message' => 'Impossible de supprimer une séance déjà validée ou rejetée'], 422);
        }

        $session->delete();

        return response()->json(['message' => 'Séance supprimée avec succès']);
    }

    public function pending()

    {
        $sessions = Session::with(['teacher', 'matiere'])
            ->where('statut', 'EN_ATTENTE')
            ->orderBy('date', 'desc')
            ->get();
            
        return response()->json($sessions);
    }

    public function validated(Request $request)
    {
        $request->validate([
            'teacher_id' => 'nullable|integer|exists:users,id',
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date|after_or_equal:date_from',
        ]);

        $sessions = $this->approvedSessionsQuery($request)
            ->orderBy('date', 'desc')
            ->get();

        return response()->json($sessions);
    }
    public function approve(Request $request, $id)
    {
        $session = Session::with(['teacher', 'matiere'])->findOrFail($id);
        $session->update([
            'statut' => 'APPROUVE',
            'date_validation' => now(),
        ]);
        
        // Refresh to get updated data
        $session->refresh();
        $session->load(['teacher', 'matiere']);
        
        // Notify the teacher
        $session->teacher->notify(new SessionStatusUpdated($session, 'APPROUVE'));
        app(ExpoPushService::class)->sendToUsers(
            [$session->teacher],
            'Séance approuvée',
            'Votre séance a été approuvée.',
            [
                'type' => 'status_update',
                'session_id' => $session->id,
                'status' => 'APPROUVE',
            ]
        );

        return response()->json($session);
    }

    public function reject(Request $request, $id)
    {
        $request->validate(['motif_rejet' => 'required']);
        
        $session = Session::with(['teacher', 'matiere'])->findOrFail($id);
        $session->update([
            'statut' => 'REJETE',
            'motif_rejet' => $request->motif_rejet,
            'date_validation' => now(),
        ]);
        
        // Refresh to get updated data
        $session->refresh();
        $session->load(['teacher', 'matiere']);
        
        // Notify the teacher
        $session->teacher->notify(new SessionStatusUpdated($session, 'REJETE'));
        app(ExpoPushService::class)->sendToUsers(
            [$session->teacher],
            'Séance rejetée',
            'Votre séance a été rejetée.',
            [
                'type' => 'status_update',
                'session_id' => $session->id,
                'status' => 'REJETE',
            ]
        );

        return response()->json($session);
    }

    public function stats()
    {
        $startOfMonth = now()->startOfMonth();

        $pendingCount = Session::where('statut', 'EN_ATTENTE')->count();
        $validatedCount = Session::where('statut', 'APPROUVE')->count(); // Total validated
        
        // Validated this month
        $validatedThisMonth = Session::where('statut', 'APPROUVE')
            ->whereMonth('date', now()->month)
            ->whereYear('date', now()->year)
            ->count();

        $approvedSessions = Session::where('statut', 'APPROUVE')
            ->whereDate('date', '>=', $startOfMonth->toDateString())
            ->get(['type_seance', 'duree']);

        $totalHours = $approvedSessions->sum(
            fn (Session $session) => Session::weightedTeachingHours($session->type_seance, $session->duree)
        );

        $activeTeachers = Session::distinct('enseignant_id')->count('enseignant_id');

        $distribution = $approvedSessions
            ->groupBy('type_seance')
            ->map(function ($sessions, $label) {
                return [
                    'label' => $label,
                    'weighted_hours' => $sessions->sum(
                        fn (Session $session) => Session::weightedTeachingHours($session->type_seance, $session->duree)
                    ),
                ];
            })
            ->values();

        // Calculate percentages from weighted hours so totals stay coherent.
        $distData = $distribution->map(function ($item) use ($totalHours) {
            return [
                'label' => $item['label'],
                'val' => $totalHours > 0 ? round(($item['weighted_hours'] / $totalHours) * 100) : 0,
                'color' => match($item['label']) {
                    'CM' => 'bg-purple-500',
                    'TD' => 'bg-orange-500', 
                    'TP' => 'bg-pink-500',
                    default => 'bg-slate-500'
                }
            ];
        });

        return response()->json([
            'pending_count' => $pendingCount,
            'validated_count' => $validatedCount,
            'validated_this_month' => $validatedThisMonth,
            'total_hours' => round($totalHours, 1),
            'active_teachers' => $activeTeachers,
            'distribution' => $distData
        ]);
    }

    public function exportAccounting(Request $request)
    {
        $request->validate([
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date|after_or_equal:date_from',
        ]);

        $query = Session::with(['teacher', 'matiere'])
            ->where('statut', 'APPROUVE');

        if ($request->filled('date_from')) {
            $query->whereDate('date', '>=', $request->date_from);
        } else {
            $query->whereDate('date', '>=', now()->startOfMonth());
        }

        if ($request->filled('date_to')) {
            $query->whereDate('date', '<=', $request->date_to);
        }

        $sessions = $query->get();

        $data = $sessions->groupBy(function ($session) {
            return $session->enseignant_id . '-' . ($session->matiere->niveau ?? 'N/A') . '-' . ($session->matiere->semestre ?? '0');
        })->map(function ($group) {
            $first = $group->first();
            $teacher = $first->teacher;
            $niveau = $first->matiere->niveau ?? 'N/A';
            $semestre = $first->matiere->semestre ?? 'N/A';
            
            $hoursByTyped = $group->groupBy('type_seance')->map(function ($typeSessions) {
                return $typeSessions->sum('duree');
            });

            $cmHours = $hoursByTyped->get('CM', 0);
            $tdTpHours = $hoursByTyped->get('TD', 0) + $hoursByTyped->get('TP', 0);
            
            $weightedTotal = Session::weightedTeachingHours('CM', $cmHours) + 
                             Session::weightedTeachingHours('TD', $tdTpHours);

            return [
                'name' => $teacher->name ?? 'Inconnu',
                'niveau' => $niveau,
                'semestre' => $semestre != 'N/A' ? "S$semestre" : 'N/A',
                'cm' => round($cmHours, 2),
                'td_tp' => round($tdTpHours, 2),
                'total_equiv' => round($weightedTotal, 2),
            ];
        });

        $filename = "recup_comptable_detail_" . now()->format('Y_m_d') . ".csv";
        
        $headers = [
            "Content-type" => "text/csv",
            "Content-Disposition" => "attachment; filename=$filename",
            "Pragma" => "no-cache",
            "Cache-Control" => "must-revalidate, post-check=0, pre-check=0",
            "Expires" => "0"
        ];

        $callback = function() use ($data) {
            $file = fopen('php://output', 'w');
            fprintf($file, chr(0xEF).chr(0xBB).chr(0xBF));
            
            fputcsv($file, ['Enseignant', 'Niveau', 'Semestre', 'Heures CM', 'Heures TD/TP', 'Total Équivalent CM'], ';');

            foreach ($data as $row) {
                fputcsv($file, [
                    $row['name'],
                    $row['niveau'],
                    $row['semestre'],
                    str_replace('.', ',', $row['cm']),
                    str_replace('.', ',', $row['td_tp']),
                    str_replace('.', ',', $row['total_equiv'])
                ], ';');
            }
            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    private function approvedSessionsQuery(Request $request)
    {
        $query = Session::with(['teacher', 'matiere'])
            ->where('statut', 'APPROUVE');

        if ($request->filled('teacher_id')) {
            $query->where('enseignant_id', (int) $request->teacher_id);
        }

        if ($request->filled('date_from')) {
            $query->whereDate('date', '>=', $request->date_from);
        }

        if ($request->filled('date_to')) {
            $query->whereDate('date', '<=', $request->date_to);
        }

        if ($request->filled('niveau')) {
            $query->whereHas('matiere', function ($q) use ($request) {
                $q->where('niveau', $request->niveau);
            });
        }

        if ($request->filled('semestre')) {
            $query->whereHas('matiere', function ($q) use ($request) {
                $q->where('semestre', $request->semestre);
            });
        }

        return $query;
    }
}
