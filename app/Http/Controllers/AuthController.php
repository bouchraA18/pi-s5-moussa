<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $domain = (string) config('school.email_domain', 'supnum.mr');

        $request->validate([
            'email' => ['required', 'email'],
            'password' => 'required',
        ]);

        $email = (string) $request->email;
        $user = User::where('email', $email)->first();

        $normalizedDomain = strtolower(trim($domain));
        $endsWithDomain = str_ends_with(strtolower(trim($email)), '@' . $normalizedDomain);
        if (!$endsWithDomain) {
            if (!$user || $user->role !== 'ADMINISTRATEUR') {
                throw ValidationException::withMessages([
                    'email' => ["L'adresse email doit se terminer par @$normalizedDomain."],
                ]);
            }
        }

        // Debug logging
        if (!$user) {
            return response()->json(['message' => 'Utilisateur non trouvé'], 401);
        }
        if (! Hash::check($request->password, $user->password)) {
             return response()->json(['message' => 'Mot de passe incorrect'], 401);
        }

        if (! $user || ! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Les identifiants sont incorrects.'],
            ]);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Déconnecté avec succès']);
    }

    public function me(Request $request)
    {
        return response()->json($request->user());
    }

    public function register(Request $request)
    {
        $domain = (string) config('school.email_domain', 'supnum.mr');

        $request->validate([
            'name' => 'required|string|max:255',
            'nom' => 'nullable|string|max:255',
            'prenom' => 'nullable|string|max:255',
            'email' => ['required', 'email', 'ends_with:@' . $domain, 'unique:users,email'],
            'telephone' => 'nullable|string|max:20',
            'password' => 'required|min:8|confirmed',
        ]);

        $user = User::create([
            'name' => $request->name,
            'nom' => $request->nom,
            'prenom' => $request->prenom,
            'email' => $request->email,
            'telephone' => $request->telephone,
            'password' => Hash::make($request->password),
            'role' => 'ENSEIGNANT',
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Inscription réussie',
            'user' => $user,
            'token' => $token,
        ], 201);
    }
}
