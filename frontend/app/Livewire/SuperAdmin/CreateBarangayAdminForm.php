<?php

namespace App\Livewire\SuperAdmin;

use App\Services\FastApiService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rules\Password;
use Livewire\Component;

class CreateBarangayAdminForm extends Component
{
    public string $full_name = '';

    public string $email = '';

    public string $password = '';

    public string $password_confirmation = '';

    public string $contact_number = '';

    public ?string $successMessage = null;

    public ?string $errorMessage = null;

    public function mount(): void
    {
        abort_unless(strtolower((string) (Auth::user()->role ?? '')) === 'superadmin', 403);
    }

    public function save(): void
    {
        $this->resetFeedback();

        $validated = $this->validate([
            'full_name' => ['required', 'string', 'min:2', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255'],
            'password' => ['required', 'confirmed', Password::min(8)],
            'contact_number' => ['required', 'string', 'min:7', 'max:50'],
        ]);

        try {
            $api = app(FastApiService::class);
            $response = $api->registerBarangayAdmin([
                'full_name' => $validated['full_name'],
                'email' => $validated['email'],
                'password' => $validated['password'],
                'contact_number' => $validated['contact_number'],
            ]);

            if (! $response['successful']) {
                $rawError = json_encode($response['data'] ?? 'HTTP ' . $response['status']);
                $this->errorMessage = $response['data']['detail']
                    ?? $response['data']['message']
                    ?? 'Unable to create the barangay admin account. Backend returned: ' . $rawError;

                return;
            }

            $this->successMessage = $response['data']['message'] ?? 'Barangay admin account created successfully.';
            $this->reset(['full_name', 'email', 'password', 'password_confirmation', 'contact_number']);
            $this->dispatch('barangay-admin-created');
        } catch (\Exception $e) {
            $this->errorMessage = 'Failed to connect to the backend server. Make sure FastAPI is running.';
        }
    }

    protected function resetFeedback(): void
    {
        $this->resetValidation();
        $this->successMessage = null;
        $this->errorMessage = null;
    }

    public function render()
    {
        return view('livewire.superadmin.create-barangay-admin-form');
    }
}
