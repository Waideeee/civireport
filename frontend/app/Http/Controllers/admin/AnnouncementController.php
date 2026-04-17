<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\FastApiService;
use Illuminate\Http\Request;

class AnnouncementController extends Controller
{
    protected $api;

    public function __construct(FastApiService $api)
    {
        $this->api = $api;
    }

    public function index()
    {
        $announcements = $this->api->getAnnouncements() ?? [];
        return view('pages.Announcements', compact('announcements'));
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title'           => 'required|string|max:255',
            'post_date'       => 'required|date',
            'event_date'      => 'required|date',
            'venue'           => 'required|string|max:255',
            'description'     => 'required|string',
            'who_will_attend' => 'required|string|max:255',
        ]);

        $data['admin_id'] = auth()->id();

        $this->api->createAnnouncement($data);

        return redirect()->route('Announcements')->with('success', 'Announcement has been posted!');
    }

    public function update(Request $request, $id)
    {
        $data = $request->validate([
            'title'           => 'required|string|max:255',
            'post_date'       => 'required|date',
            'event_date'      => 'required|date',
            'venue'           => 'required|string|max:255',
            'description'     => 'required|string',
            'who_will_attend' => 'required|string|max:255',
        ]);

        $this->api->updateAnnouncement($id, $data);

        return redirect()->route('Announcements')->with('success', 'Announcement updated!');
    }

    public function destroy($id)
    {
        $this->api->deleteAnnouncement($id);
        return redirect()->route('Announcements')->with('success', 'Announcement deleted!');
    }
}