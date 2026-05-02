<?php
use Illuminate\Support\Facades\DB;

$residents = DB::table('users')->where('role', 'resident')->where('status', 'approved')->limit(3)->get();
if ($residents->isEmpty()) { echo "No approved residents found\n"; return; }

$uploadsDir = 'C:\\xampp\\htdocs\\civireport\\backend\\uploads\\';
$samplePic = $uploadsDir . 'resolution_1_1776630301.jpg';

if (!file_exists($samplePic)) { echo "Sample pic not found at {$samplePic}\n"; return; }

$complaints = [
    ['type' => 'Sanitation',    'subtype' => 'Garbage Collection',  'location' => '14 Sampaloc, Manila', 'notes' => 'Uncollected garbage for 3 days near the corner.', 'urgency' => 'high'],
    ['type' => 'Roads',         'subtype' => 'Pothole',             'location' => '67 Pandacan, Manila', 'notes' => 'Large pothole causing accidents.',                'urgency' => 'medium'],
    ['type' => 'Public Safety', 'subtype' => 'Streetlight Outage',  'location' => '23 Tondo, Manila',    'notes' => 'Streetlight has been out for a week.',            'urgency' => 'low'],
];

foreach ($complaints as $i => $c) {
    $resident = $residents[$i % count($residents)];
    $now = now();
    $complaintId = DB::table('complaint')->insertGetId([
        'complaint_date'     => $now,
        'user_id'            => $resident->user_id,
        'complaint_type'     => $c['type'],
        'complaint_subtype'  => $c['subtype'],
        'complaint_location' => $c['location'],
        'additional_notes'   => $c['notes'],
        'urgency_level'      => $c['urgency'],
        'complaint_status'   => 'pending',
        'created_at'         => $now,
        'updated_at'         => $now,
    ], 'complaint_id');
    $newName = "complaint_{$complaintId}_" . time() . "_" . substr(md5(uniqid()), 0, 8) . ".jpg";
    copy($samplePic, $uploadsDir . $newName);
    DB::table('complaint_media')->insert([
        'complaint_id' => $complaintId,
        'file_path'    => $newName,
        'media_type'   => 'image/jpeg',
    ]);
    echo "Created complaint #{$complaintId} for {$resident->user_name} with pic {$newName}\n";
}
