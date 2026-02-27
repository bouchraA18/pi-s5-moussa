<?php

namespace App\Services;

use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ExpoPushService
{
    private const ENDPOINT = 'https://exp.host/--/api/v2/push/send';

    /**
     * @param  array<int, string>  $tokens
     */
    public function sendToTokens(array $tokens, string $title, string $body, array $data = []): void
    {
        $tokens = array_values(array_unique(array_filter(array_map('trim', $tokens))));
        if (count($tokens) === 0) {
            return;
        }

        $messages = array_map(function ($to) use ($title, $body, $data) {
            return [
                'to' => $to,
                'sound' => 'default',
                'title' => $title,
                'body' => $body,
                'priority' => 'high',
                'data' => $data,
            ];
        }, $tokens);

        try {
            $res = Http::timeout(5)->post(self::ENDPOINT, $messages);
            if (! $res->ok()) {
                Log::warning('Expo push failed', ['status' => $res->status(), 'body' => $res->body()]);
            }
        } catch (\Throwable $e) {
            Log::warning('Expo push exception', ['error' => $e->getMessage()]);
        }
    }

    /**
     * @param  \Illuminate\Support\Collection<int, mixed>|array<int, mixed>  $users
     */
    public function sendToUsers($users, string $title, string $body, array $data = []): void
    {
        $collection = $users instanceof Collection ? $users : collect($users);

        $tokens = $collection
            ->flatMap(function ($u) {
                try {
                    return $u->expoPushTokens->pluck('token')->all();
                } catch (\Throwable $e) {
                    return [];
                }
            })
            ->filter()
            ->values()
            ->all();

        $this->sendToTokens($tokens, $title, $body, $data);
    }
}

