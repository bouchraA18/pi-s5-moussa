<?php

namespace App\Http\Controllers;

use App\Models\ExpoPushToken;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PushTokenController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'token' => ['required', 'string', 'max:255'],
            'platform' => ['nullable', 'string', 'max:20'],
        ]);

        $token = trim((string) $data['token']);
        if (! str_starts_with($token, 'ExponentPushToken[') && ! str_starts_with($token, 'ExpoPushToken[')) {
            return response()->json(['message' => 'Token push invalide'], 422);
        }

        $user = Auth::user();

        ExpoPushToken::updateOrCreate(
            ['token' => $token],
            ['user_id' => $user->id, 'platform' => $data['platform'] ?? null]
        );

        return response()->json(['success' => true]);
    }
}

