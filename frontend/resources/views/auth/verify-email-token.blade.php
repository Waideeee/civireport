<x-guest-layout>
    <x-authentication-card>
        <x-slot name="logo">
            <x-authentication-card-logo />
        </x-slot>

        <x-validation-errors class="mb-4" />

        @if (session('status'))
            <div class="mb-4 font-medium text-sm text-green-600">
                {{ session('status') }}
            </div>
        @endif

        <div class="mb-6 text-sm text-gray-600">
            {{ $errorMessage ?? 'Verification link is invalid or has expired.' }}
        </div>

        <form method="POST" action="{{ route('barangay-admin.verification.resend') }}">
            @csrf

            <div>
                <x-label for="email" value="{{ __('Email') }}" />
                <x-input
                    id="email"
                    class="block mt-1 w-full"
                    type="email"
                    name="email"
                    :value="old('email', $email)"
                    required
                    autofocus
                />
            </div>

            <div class="flex items-center justify-between mt-6">
                <a href="{{ url('/login') }}" class="underline text-sm text-gray-600 hover:text-gray-900 rounded-md">
                    Back to login
                </a>

                <x-button>
                    Resend Verification Email
                </x-button>
            </div>
        </form>
    </x-authentication-card>
</x-guest-layout>
