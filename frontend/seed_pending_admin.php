<?php

use App\Models\User;
use Illuminate\Support\Facades\Hash;

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$email = 'juan.delacruz@example.com';
$password = 'password';

$user = User::where('email', $email)->first();

if (!$user) {
    User::create([
        'user_name' => 'Juan Dela Cruz',
        'email' => $email,
        'password' => Hash::make($password),
        'role' => 'admin',
        'status' => 'pending',
        'barangay' => 'Barangay 846',
        'is_active' => false,
        'date_registered' => now(),
    ]);
    echo "Pending Admin account created for testing.\n";
} else {
    echo "Test user already exists.\n";
}
