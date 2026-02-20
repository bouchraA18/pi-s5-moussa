<?php

namespace App\Http\Controllers;

use App\Models\Session;
use App\Models\User;
use App\Notifications\NewSessionPointed;
use App\Notifications\SessionStatusUpdated;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;

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
        $request->validate([
            'matiere_id' => 'required|exists:matieres,id',
            'date' => 'required|date',
            'heure_debut' => 'required',
            'heure_fin' => 'required',
            'type_seance' => 'required|in:CM,TD,TP',
            'annee_scolaire_id' => 'required|exists:annee_scolaires,id',
        ]);

        // Basic duration calculation (can be improved)
        $start = strtotime($request->heure_debut);
        $end = strtotime($request->heure_fin);
        $duree = ($end - $start) / 3600;

        $session = Session::create([
            'enseignant_id' => Auth::id(),
            'matiere_id' => $request->matiere_id,
            'annee_scolaire_id' => $request->annee_scolaire_id,
            'date' => $request->date,
            'heure_debut' => $request->heure_debut,
            'heure_fin' => $request->heure_fin,
            'duree' => $duree,
            'type_seance' => $request->type_seance,
            'statut' => 'EN_ATTENTE',
        ]);

        // Notify all agents
        $agents = User::where('role', 'AGENT_SCOLARITE')->get();
        Notification::send($agents, new NewSessionPointed($session));

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
            'heure_debut' => 'required',
            'heure_fin' => 'required',
            'type_seance' => 'required|in:CM,TD,TP',
        ]);

        $start = strtotime($request->heure_debut);
        $end = strtotime($request->heure_fin);
        $duree = ($end - $start) / 3600;

        $session->update([
            'matiere_id' => $request->matiere_id,
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
