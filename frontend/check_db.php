<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$users = Illuminate\Support\Facades\DB::table('users')
    ->select('role', 'status', Illuminate\Support\Facades\DB::raw('count(*) as total'))
    ->groupBy('role', 'status')
    ->get();

foreach ($users as $user) {
    echo "Role: [{$user->role}], Status: [{$user->status}], Total: {$user->total}\n";
}

$complaints = Illuminate\Support\Facades\DB::table('complaint')->count();
echo "Total Complaints: $complaints\n";
