<?php

namespace App\Http\Controllers;

use App\Models\Matiere;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class TeacherMatiereController extends Controller
{
    public function mySemesters()
    {
        $user = Auth::user();
        if (!$user || $user->role !== 'ENSEIGNANT') {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $assignedSemesters = $user->matieres()
            ->select(['niveau', 'semestre'])
            ->distinct()
            ->get();

        $scheduledSemesters = \App\Models\Matiere::whereIn('id', 
                $user->schedules()->pluck('matiere_id')
            )
            ->select(['niveau', 'semestre'])
            ->distinct()
            ->get();

        $semesters = $assignedSemesters->concat($scheduledSemesters)
            ->unique(fn($item) => $item->niveau . '-' . $item->semestre)
            ->map(fn($row) => [
                'niveau' => $row->niveau,
                'semestre' => (int) $row->semestre,
            ])
            ->sortBy(fn($item) => $item['niveau'] . $item['semestre'])
            ->values();

        return response()->json(['semesters' => $semesters]);
    }

    public function myMatieres(Request $request)
    {
        $user = Auth::user();
        if (!$user || $user->role !== 'ENSEIGNANT') {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $request->validate([
            'niveau' => 'nullable|string',
            'semestre' => 'nullable|integer',
        ]);

        $assignedIds = $user->matieres()->pluck('matieres.id');
        $scheduledIds = $user->schedules()->pluck('matiere_id');
        $allIds = $assignedIds->concat($scheduledIds)->unique();

        $query = Matiere::whereIn('id', $allIds);

        if ($request->filled('niveau')) {
            $query->where('niveau', (string) $request->niveau);
        }
        if ($request->filled('semestre')) {
            $query->where('semestre', (int) $request->semestre);
        }

        return response()->json($query->orderBy('code')->get());
    }

    public function getTeacherSemesterMatieres(Request $request)
    {
        $actor = Auth::user();
        if (!$actor || !in_array($actor->role, ['AGENT_SCOLARITE', 'ADMINISTRATEUR'], true)) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $request->validate([
            'teacher_id' => 'required|exists:users,id',
            'niveau' => 'required|string',
            'semestre' => 'required|integer',
        ]);

        $teacher = User::findOrFail((int) $request->teacher_id);
        if ($teacher->role !== 'ENSEIGNANT') {
            return response()->json(['message' => 'Utilisateur non enseignant'], 422);
        }

        $matiereIds = $teacher->matieres()
            ->where('matieres.niveau', (string) $request->niveau)
            ->where('matieres.semestre', (int) $request->semestre)
            ->pluck('matieres.id')
            ->map(fn ($id) => (int) $id)
            ->values();

        return response()->json(['matiere_ids' => $matiereIds]);
    }

    public function syncTeacherSemesterMatieres(Request $request)
    {
        $actor = Auth::user();
        if (!$actor || !in_array($actor->role, ['AGENT_SCOLARITE', 'ADMINISTRATEUR'], true)) {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $request->validate([
            'teacher_id' => 'required|exists:users,id',
            'niveau' => 'required|string',
            'semestre' => 'required|integer',
            'matiere_ids' => 'array',
            'matiere_ids.*' => 'integer|exists:matieres,id',
        ]);

        $teacher = User::findOrFail((int) $request->teacher_id);
        if ($teacher->role !== 'ENSEIGNANT') {
            return response()->json(['message' => 'Utilisateur non enseignant'], 422);
        }

        $niveau = (string) $request->niveau;
        $semestre = (int) $request->semestre;
        $matiereIds = collect($request->input('matiere_ids', []))
            ->map(fn ($id) => (int) $id)
            ->values();

        // Ensure selected matieres match semester
        if ($matiereIds->isNotEmpty()) {
            $countMatching = Matiere::query()
                ->whereIn('id', $matiereIds->all())
                ->where('niveau', $niveau)
                ->where('semestre', $semestre)
                ->count();

            if ($countMatching !== $matiereIds->count()) {
                return response()->json(['message' => "Certaines matières ne correspondent pas au semestre sélectionné."], 422);
            }
        }

        // Detach only within this semester
        $currentForSemesterIds = $teacher->matieres()
            ->where('matieres.niveau', $niveau)
            ->where('matieres.semestre', $semestre)
            ->pluck('matieres.id')
            ->map(fn ($id) => (int) $id)
            ->values();

        $toDetach = $currentForSemesterIds->diff($matiereIds)->values();
        if ($toDetach->isNotEmpty()) {
            $teacher->matieres()->detach($toDetach->all());
        }

        $toAttach = $matiereIds->diff($currentForSemesterIds)->values();
        if ($toAttach->isNotEmpty()) {
            $attach = [];
            foreach ($toAttach as $id) {
                $attach[(int) $id] = ['assigned_by' => $actor->id];
            }
            $teacher->matieres()->attach($attach);
        }

        $matiereIds = $teacher->matieres()
            ->where('matieres.niveau', $niveau)
            ->where('matieres.semestre', $semestre)
            ->pluck('matieres.id')
            ->map(fn ($id) => (int) $id)
            ->values();

        return response()->json(['matiere_ids' => $matiereIds]);
    }
}
