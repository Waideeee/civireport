<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\FastApiService;
use Illuminate\Http\Request;

class UserController extends Controller
{
    protected $api;

    public function __construct(FastApiService $api)
    {
        $this->api = $api;
    }

    public function index()
    {
        $users = $this->api->getUsers();
        return view('pages.UserRecords', compact('users'));
    }

    public function show($id)
    {
        $user = $this->api->getUser($id);
        return view('pages.UserRecords', compact('user'));
    }

    public function updateStatus(Request $request, $id)
    {
        $result = $this->api->updateUserStatus($id, $request->status);
        return response()->json($result);
    }
}
