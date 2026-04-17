import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';

export default defineConfig({
    plugins: [
        laravel({
            input: [
                'resources/css/app.css',
                'resources/js/app.js',
                'resources/css/dashboard.css',
                'resources/css/Complaints.css',
                'resources/js/Complaints.js',
                'resources/css/UserRecords.css',
                'resources/js/UserRecords.js',
                'resources/css/ReportAnalytics.css',
                'resources/js/ReportAnalytics.js',
                'resources/css/AuditLog.css',
            ],
            refresh: true,
        }),
    ],
});
