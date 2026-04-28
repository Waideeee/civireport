<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$users = Illuminate\Support\Facades\DB::table('users')
    ->select('role', 'status', 'is_active', Illuminate\Support\Facades\DB::raw('count(*) as total'))
    ->groupBy('role', 'status', 'is_active')
    ->get();

foreach ($users as $user) {
    $active = $user->is_active ? 'True' : 'False';
    echo "Role: [{$user->role}], Status: [{$user->status}], IsActive: [$active], Total: {$user->total}\n";
}
