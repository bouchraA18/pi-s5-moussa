<?php
// Script to manually create a user globally
use App\Models\User;
use Illuminate\Support\Facades\Hash;

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$email = 'moussa@ecole.edu';
$password = 'password123';

$user = User::where('email', $email)->first();
if ($user) {
    $user->password = Hash::make($password);
    $user->save();
    echo "Password updated for $email\n";
} else {
    User::create([
        'name' => 'Professeur Moussa',
        'nom' => 'Moussa',
        'prenom' => 'Jean',
        'email' => $email,
        'password' => Hash::make($password),
        'role' => 'ENSEIGNANT',
    ]);
    echo "User created: $email\n";
}
