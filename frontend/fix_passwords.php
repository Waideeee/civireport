<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use Illuminate\Support\Facades\Hash;

$users = User::all();
foreach ($users as $user) {
    // If password starts with $2y$ or $2a$, it's already hashed
    if (str_starts_with($user->password, '$2y$') || str_starts_with($user->password, '$2a$')) {
        echo "Skipping {$user->email}, already hashed.\n";
        continue;
    }

    $oldPassword = $user->password;
    $user->password = Hash::make($oldPassword);
    $user->save();
    echo "Hashed password for: {$user->email}\n";
}
echo "Done!\n";
