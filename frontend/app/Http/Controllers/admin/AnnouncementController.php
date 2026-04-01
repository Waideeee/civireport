<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Announcement; 
use Illuminate\Http\Request;


class AnnouncementController extends Controller 
{ 
    public function index() { 
        $announcements = Announcement :: latest()->get();
        return view('pages.Announcements', compact('announcements'));
    }

    public function create() { 
        return view ('pages.announcements.create');
    }

    public function store(Request $request){
        $request->validate([ 
            'title' => 'required| string| max: 255',
            'post_date' => 'required| date',
            'event_date' => 'required| date',
            'venue' => 'required| string| max: 255',
            'description'=> 'required| string',
            'who_will_attend' => 'required| string| max: 255',
        ]);

        Announcement::create([
            'title' => $request->title, 
            'post_date' => $request-> post_date, 
            'event_date' => $request-> event_date,
            'venue' => $request-> venue,
            'description' => $request-> description,
            'who_will_attend' => $request-> who_will_attend,
            'admin_id' => auth() -> id(),
        ]);  


    return redirect() ->route ('Announcements')-> with ('success', 'Announcement has been posted!');
    } 

    public function delete($id){ 
        Announcement::findOrFail($id)-> delete(); 
        return redirect() -> route('Announcements') -> with ('success', 'Announcement has been deleted!');
    }
}