<?php

namespace App\Http\Controllers;

use App\Models\Matiere;
use Illuminate\Http\Request;

class MatiereController extends Controller
{
    public function index(Request $request)
    {
        $query = Matiere::query();

        if ($request->filled('niveau')) {
            $query->where('niveau', (string) $request->niveau);
        }
        if ($request->filled('semestre')) {
            $query->where('semestre', (int) $request->semestre);
        }

        return response()->json($query->orderBy('code')->get());
    }

    public function store(Request $request)
    {
        $request->validate([
            'code' => 'required|string|unique:matieres,code',
            'nom' => 'required|string',
            'description' => 'nullable|string',
            'niveau' => 'required|string',
            'semestre' => 'required|integer|min:1|max:2',
            'filiale' => 'nullable|string',
            'credit' => 'required|integer',
            'nombre_heures_prevu' => 'required|numeric',
        ]);

        $matiere = Matiere::create($request->all());

        return response()->json($matiere, 201);
    }

    public function update(Request $request, $id)
    {
        $matiere = Matiere::findOrFail($id);

        $request->validate([
            'code' => 'required|string|unique:matieres,code,' . $id,
            'nom' => 'required|string',
            'description' => 'nullable|string',
            'niveau' => 'required|string',
            'semestre' => 'required|integer|min:1|max:2',
            'filiale' => 'nullable|string',
            'credit' => 'required|integer',
            'nombre_heures_prevu' => 'required|numeric',
        ]);

        $matiere->update($request->all());

        return response()->json($matiere);
    }

    public function destroy($id)
    {
        $matiere = Matiere::findOrFail($id);
        $matiere->delete();
        return response()->json(['message' => 'Matière supprimée avec succès']);
    }
}
