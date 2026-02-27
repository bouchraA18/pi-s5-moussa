<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use Illuminate\Support\Facades\Hash;

$user = User::where('email', 'prof@test.com')->first();
if ($user) {
    $user->password = Hash::make('password123');
    if ($user->save()) {
        echo "SUCCESS: Password reset for prof@test.com\n";
    } else {
        echo "FAILURE: Could not save user\n";
    }
} else {
    echo "FAILURE: User prof@test.com not found\n";
}
