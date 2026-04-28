<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Add barangay column
        Schema::table('users', function (Blueprint $table) {
            $table->string('barangay', 255)->nullable()->after('address');
        });

        // Update role column to ENUM
        // Using raw SQL for PostgreSQL compatibility and data preservation
        DB::transaction(function () {
            // 1. Create the enum type if it doesn't exist
            DB::statement("DO $$ BEGIN
                CREATE TYPE user_role AS ENUM ('Resident', 'admin', 'superadmin');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;");

            // 2. Alter the column type using the new enum
            // We use 'USING role::user_role' to cast existing values.
            // Note: If existing values don't match, this might fail.
            // Let's ensure existing 'Admin' or other variations are mapped correctly.
            DB::statement("UPDATE users SET role = 'admin' WHERE LOWER(role) = 'admin'");
            DB::statement("UPDATE users SET role = 'Resident' WHERE LOWER(role) = 'resident' OR role IS NULL OR role = ''");

            DB::statement("ALTER TABLE users ALTER COLUMN role TYPE user_role USING role::user_role");
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('barangay');
        });

        DB::statement("ALTER TABLE users ALTER COLUMN role TYPE VARCHAR(255) USING role::VARCHAR");
        DB::statement("DROP TYPE IF EXISTS user_role");
    }
};
