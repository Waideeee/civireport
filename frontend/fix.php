<?php
use Illuminate\Support\Facades\DB;
DB::statement("SELECT setval('users_user_id_seq', (SELECT MAX(user_id) FROM users) + 1);");
echo "Sequence fixed!\n";
