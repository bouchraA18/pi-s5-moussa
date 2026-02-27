<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class CreateUser extends Command
{
    protected $signature = 'user:create
                            {email : Email address}
                            {--name= : Display name (required when creating)}
                            {--nom= : Last name}
                            {--prenom= : First name}
                            {--telephone= : Phone number}
                            {--role= : ENSEIGNANT|AGENT_SCOLARITE|ADMINISTRATEUR (or aliases: teacher|agent|admin)}
                            {--password= : Password (unsafe: stored in shell history)}
                            {--update : Update the user if it already exists}';

    protected $description = 'Create (or update) a user from the command line';

    public function handle(): int
    {
        $email = (string) $this->argument('email');
        $existingUser = User::where('email', $email)->first();

        if ($existingUser && ! $this->option('update')) {
            $this->error("User already exists: {$email}. Re-run with --update to modify it.");
            return self::FAILURE;
        }

        $role = $this->normalizeRole($this->option('role'));
        if (! $role && ! $this->option('no-interaction')) {
            $role = $this->choice('Role', ['ENSEIGNANT', 'AGENT_SCOLARITE', 'ADMINISTRATEUR'], 0);
        }

        $name = $this->option('name');
        if (! $name && ! $existingUser && ! $this->option('no-interaction')) {
            $name = $this->ask('Name');
        }

        $password = $this->option('password');
        if (! $password && ! $this->option('no-interaction')) {
            $password = (string) $this->secret('Password (min 8 chars)');
            $confirm = (string) $this->secret('Confirm password');
            if ($password !== $confirm) {
                $this->error('Password confirmation does not match.');
                return self::FAILURE;
            }
        }

        $data = [
            'email' => $email,
            'name' => $name,
            'nom' => $this->option('nom'),
            'prenom' => $this->option('prenom'),
            'telephone' => $this->option('telephone'),
            'role' => $role,
            'password' => $password,
        ];

        $rules = [
            'email' => ['required', 'email'],
            'name' => [$existingUser ? 'nullable' : 'required', 'string', 'max:255'],
            'nom' => ['nullable', 'string', 'max:255'],
            'prenom' => ['nullable', 'string', 'max:255'],
            'telephone' => ['nullable', 'string', 'max:20'],
            'role' => ['required', Rule::in(['ENSEIGNANT', 'AGENT_SCOLARITE', 'ADMINISTRATEUR'])],
            'password' => [$existingUser ? 'nullable' : 'required', 'string', 'min:8'],
        ];

        $validator = Validator::make($data, $rules);
        if ($validator->fails()) {
            foreach ($validator->errors()->all() as $message) {
                $this->error($message);
            }
            $this->line('Tip: run `php artisan user:roles` to see valid role values.');
            return self::FAILURE;
        }

        if ($existingUser) {
            $existingUser->fill(collect($data)->only([
                'name', 'nom', 'prenom', 'telephone', 'role',
            ])->toArray());

            if (! empty($password)) {
                $existingUser->password = Hash::make($password);
            }

            $existingUser->save();
            $this->info("Updated user: {$existingUser->email} ({$existingUser->role})");
            return self::SUCCESS;
        }

        $user = User::create([
            'email' => $email,
            'name' => $name,
            'nom' => $this->option('nom'),
            'prenom' => $this->option('prenom'),
            'telephone' => $this->option('telephone'),
            'role' => $role,
            'password' => Hash::make($password),
        ]);

        $this->info("Created user: {$user->email} ({$user->role})");
        return self::SUCCESS;
    }

    private function normalizeRole($role): ?string
    {
        if ($role === null) {
            return null;
        }

        $raw = strtoupper(trim((string) $role));

        return match ($raw) {
            'ENSEIGNANT', 'TEACHER' => 'ENSEIGNANT',
            'AGENT_SCOLARITE', 'AGENT' => 'AGENT_SCOLARITE',
            'ADMINISTRATEUR', 'ADMIN' => 'ADMINISTRATEUR',
            default => null,
        };
    }
}

