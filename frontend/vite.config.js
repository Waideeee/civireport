import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';

export default defineConfig({
    plugins: [
        laravel({
            input: [
                'resources/css/app.css',
                'resources/js/app.js',
                'resources/css/sidebar.css',
                'resources/js/sidebar.js',
                'resources/css/dashboard.css',
                'resources/js/dashboard.js',
                'resources/css/Complaints.css',
                'resources/js/Complaints.js',
                'resources/css/UserRecords.css',
                'resources/js/UserRecords.js',
                'resources/css/ReportAnalytics.css',
                'resources/js/ReportAnalytics.js',
                'resources/css/AuditLog.css',
                'resources/js/AuditLog.js',
                'resources/css/Announcements.css',
                'resources/js/Announcements.js',
                'resources/css/EmergencyReports.css',
                'resources/js/EmergencyReports.js',
                'resources/css/emergency-alert.css',
                'resources/js/emergency-alert.js',
                'resources/js/global-notifications.js',
                'resources/css/superadmin.css',
                'resources/js/superadmin-admins.js',
                'resources/js/superadmin-audit.js',
                'resources/js/superadmin-dashboard.js',
                'resources/js/profile-save-reload.js',
            ],
            refresh: true,
        }),
    ],
});
