<?php

namespace App\Http\Controllers;

use App\Models\Session;
use App\Models\User;
use App\Notifications\NewSessionPointed;
use App\Notifications\SessionStatusUpdated;
use App\Services\ExpoPushService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Validation\Rule;

class PointageController extends Controller
{
    private const TIME_SLOTS = [
        ['08:00', '09:30'],
        ['09:45', '11:15'],
        ['11:30', '13:00'],
        ['15:00', '16:30'],
        ['17:00', '18:30'],
    ];

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
            return response()->json(['message' => 'Non autorisÃ©'], 403);
        }

        $allowedStarts = array_map(fn ($s) => $s[0], self::TIME_SLOTS);
        $allowedEnds = array_map(fn ($s) => $s[1], self::TIME_SLOTS);

        $request->validate([
            'matiere_id' => 'required|exists:matieres,id',
            'date' => 'required|date',
            'heure_debut' => ['required', 'date_format:H:i', Rule::in($allowedStarts)],
            'heure_fin' => ['required', 'date_format:H:i', Rule::in($allowedEnds)],
            'type_seance' => 'required|in:CM,TD,TP',
            'annee_scolaire_id' => 'required|exists:annee_scolaires,id',
        ]);

        $slotValid = in_array([$request->heure_debut, $request->heure_fin], self::TIME_SLOTS, true);
        if (!$slotValid) {
            return response()->json(['message' => "Horaire invalide"], 422);
        }

        $matiereId = (int) $request->matiere_id;
        if (!$user->matieres()->whereKey($matiereId)->exists()) {
            return response()->json(['message' => "MatiÃ¨re non assignÃ©e Ã  cet enseignant."], 403);
        }

        // Basic duration calculation (can be improved)
        $start = strtotime($request->heure_debut);
        $end = strtotime($request->heure_fin);
        $duree = ($end - $start) / 3600;

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

        $allowedStarts = array_map(fn ($s) => $s[0], self::TIME_SLOTS);
        $allowedEnds = array_map(fn ($s) => $s[1], self::TIME_SLOTS);

        $request->validate([
            'matiere_id' => 'required|exists:matieres,id',
            'date' => 'required|date',
            'heure_debut' => ['required', 'date_format:H:i', Rule::in($allowedStarts)],
            'heure_fin' => ['required', 'date_format:H:i', Rule::in($allowedEnds)],
            'type_seance' => 'required|in:CM,TD,TP',
        ]);

        $slotValid = in_array([$request->heure_debut, $request->heure_fin], self::TIME_SLOTS, true);
        if (!$slotValid) {
            return response()->json(['message' => "Horaire invalide"], 422);
        }

        $user = Auth::user();
        $matiereId = (int) $request->matiere_id;
        if (!$user || $user->role !== 'ENSEIGNANT') {
            return response()->json(['message' => 'Non autorisÃ©'], 403);
        }
        if (!$user->matieres()->whereKey($matiereId)->exists()) {
            return response()->json(['message' => "MatiÃ¨re non assignÃ©e Ã  cet enseignant."], 403);
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

    public function validated()
    {
        $sessions = Session::with(['teacher', 'matiere'])
            ->whereIn('statut', ['APPROUVE', 'REJETE'])
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
        $pendingCount = Session::where('statut', 'EN_ATTENTE')->count();
        $validatedCount = Session::where('statut', 'APPROUVE')->count(); // Total validated
        
        // Validated this month
        $validatedThisMonth = Session::where('statut', 'APPROUVE')
            ->whereMonth('date', now()->month)
            ->whereYear('date', now()->year)
            ->count();

        $totalHours = Session::where('statut', 'APPROUVE')->sum('duree');

        $activeTeachers = Session::distinct('enseignant_id')->count('enseignant_id');

        // Distribution by type (CM, TD, TP) based on hours
        $distribution = Session::where('statut', 'APPROUVE')
            ->select('type_seance as label', DB::raw('sum(duree) as total_hours'))
            ->groupBy('type_seance')
            ->get();
            
        // Calculate percentages
        $distData = $distribution->map(function($item) use ($totalHours) {
            return [
                'label' => $item->label,
                'val' => $totalHours > 0 ? round(($item->total_hours / $totalHours) * 100) : 0,
                'color' => match($item->label) {
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
}
