<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        // Return all users, potentially filtered by role if needed
        return response()->json(User::all());
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $domain = (string) config('school.email_domain', 'supnum.mr');
        $role = (string) $request->input('role', '');

        $emailRules = ['required', 'email', 'unique:users,email'];
        if ($role === 'ENSEIGNANT') {
            $emailRules[] = 'ends_with:@' . $domain;
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'nom' => 'nullable|string|max:255',
            'prenom' => 'nullable|string|max:255',
            'email' => $emailRules,
            'role' => 'required|in:ENSEIGNANT,AGENT_SCOLARITE,ADMINISTRATEUR',
            'telephone' => 'nullable|string|max:20',
            'password' => 'required|string|min:8', // Admin sets initial password
        ]);

        $user = User::create([
            'name' => $request->name,
            'nom' => $request->nom,
            'prenom' => $request->prenom,
            'email' => $request->email,
            'role' => $request->role,
            'telephone' => $request->telephone,
            'password' => Hash::make($request->password),
        ]);

        return response()->json($user, 201);
    }

    /**
     * Display the specified resource.
     */
    public function show($id)
    {
        return response()->json(User::findOrFail($id));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);
        $domain = (string) config('school.email_domain', 'supnum.mr');
        $role = (string) $request->input('role', '');

        $emailRules = ['required', 'email', Rule::unique('users')->ignore($user->id)];
        if ($role === 'ENSEIGNANT') {
            $emailRules[] = 'ends_with:@' . $domain;
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'nom' => 'nullable|string|max:255',
            'prenom' => 'nullable|string|max:255',
            'email' => $emailRules,
            'role' => 'required|in:ENSEIGNANT,AGENT_SCOLARITE,ADMINISTRATEUR',
            'telephone' => 'nullable|string|max:20',
        ]);

        $user->update($request->only([
            'name', 'nom', 'prenom', 'email', 'role', 'telephone'
        ]));

        if ($request->filled('password')) {
             $user->update(['password' => Hash::make($request->password)]);
        }

        return response()->json($user);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        $user = User::findOrFail($id);
        
        // Prevent deleting oneself? Maybe handling in frontend or policy
        if (auth()->id() == $id) {
            return response()->json(['message' => 'Vous ne pouvez pas supprimer votre propre compte.'], 403);
        }

        $user->delete();

        return response()->json(['message' => 'Utilisateur supprimé avec succès']);
    }
}
