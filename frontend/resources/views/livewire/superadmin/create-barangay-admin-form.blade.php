<div>
    <style>
    .sa-form-grid {
        display: grid; 
        grid-template-columns: repeat(2, minmax(0, 1fr)); 
        gap: 20px;
    }

    .sa-form-group {
        display: flex;
        flex-direction: column;
    }

    .sa-form-group.full-width {
        grid-column: span 2;
    }

    .sa-label {
        display: block;
        margin-bottom: 8px;
        font-weight: 600;
        font-size: 0.9rem;
        color: #374151;
    }

    .sa-input {
        width: 100%;
        padding: 12px 16px;
        border: 1px solid #d1d5db;
        border-radius: 8px;
        font-size: 0.95rem;
        color: #111827;
        background-color: #f9fafb;
        transition: all 0.2s ease;
        outline: none;
        box-sizing: border-box;
    }

    .sa-input:focus {
        border-color: #3b82f6;
        background-color: #ffffff;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
    }

    .sa-input::placeholder {
        color: #9ca3af;
    }

    .sa-error {
        margin-top: 6px;
        color: #ef4444;
        font-size: 0.85rem;
    }

    .sa-btn-submit {
        background: linear-gradient(135deg, #2563eb, #1d4ed8);
        color: #ffffff;
        font-weight: 600;
        padding: 12px 24px;
        border: none;
        border-radius: 8px;
        font-size: 0.95rem;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2), 0 2px 4px -1px rgba(37, 99, 235, 0.1);
    }

    .sa-btn-submit:hover {
        transform: translateY(-1px);
        box-shadow: 0 6px 8px -1px rgba(37, 99, 235, 0.3), 0 4px 6px -1px rgba(37, 99, 235, 0.2);
    }

    .sa-btn-submit:active {
        transform: translateY(0);
    }

    @media (max-width: 768px) {
        .sa-form-grid {
            grid-template-columns: 1fr;
        }
        .sa-form-group.full-width {
            grid-column: span 1;
        }
    }
    </style>

    <div class="table-card" style="margin-bottom: 32px; padding: 28px;">
        <div class="section-header" style="margin-bottom: 24px;">
            <div>
                <div class="section-title" style="font-size: 1.25rem; font-weight: 700; color: #111827; margin-bottom: 4px;">Create Barangay Admin</div>
                <div class="section-sub" style="font-size: 0.9rem; color: #6b7280;">Only superadmins can provision barangay admin accounts.</div>
            </div>
        </div>

        @if ($successMessage)
            <div style="margin-bottom: 20px; padding: 14px 16px; border-radius: 8px; background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0; display: flex; align-items: center; gap: 8px; font-size: 0.95rem;">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                {{ $successMessage }}
            </div>
        @endif

        @if ($errorMessage)
            <div style="margin-bottom: 20px; padding: 14px 16px; border-radius: 8px; background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; display: flex; align-items: center; gap: 8px; font-size: 0.95rem;">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                {{ $errorMessage }}
            </div>
        @endif

        <form wire:submit="save">
            <div class="sa-form-grid">
                <div class="sa-form-group">
                    <label for="sa-full-name" class="sa-label">Full Name</label>
                    <input id="sa-full-name" type="text" wire:model.blur="full_name" class="sa-input" placeholder="Juan Dela Cruz">
                    @error('full_name') <div class="sa-error">{{ $message }}</div> @enderror
                </div>

                <div class="sa-form-group">
                    <label for="sa-email" class="sa-label">Email</label>
                    <input id="sa-email" type="email" wire:model.blur="email" class="sa-input" placeholder="admin@barangay.gov.ph">
                    @error('email') <div class="sa-error">{{ $message }}</div> @enderror
                </div>

                <div class="sa-form-group">
                    <label for="sa-password" class="sa-label">Password</label>
                    <input id="sa-password" type="password" wire:model.blur="password" class="sa-input" placeholder="Temporary password">
                    @error('password') <div class="sa-error">{{ $message }}</div> @enderror
                </div>

                <div class="sa-form-group">
                    <label for="sa-password-confirmation" class="sa-label">Confirm Password</label>
                    <input id="sa-password-confirmation" type="password" wire:model.blur="password_confirmation" class="sa-input" placeholder="Repeat password">
                </div>

                <div class="sa-form-group full-width">
                    <label for="sa-contact-number" class="sa-label">Contact Number</label>
                    <input id="sa-contact-number" type="text" wire:model.blur="contact_number" class="sa-input" placeholder="09XXXXXXXXX">
                    @error('contact_number') <div class="sa-error">{{ $message }}</div> @enderror
                </div>
            </div>

            <div style="margin-top: 28px; display:flex; justify-content:flex-end;">
                <button type="submit" class="sa-btn-submit">
                    <span wire:loading.remove wire:target="save">Create Barangay Admin</span>
                    <span wire:loading wire:target="save">Processing...</span>
                </button>
            </div>
        </form>
    </div>
</div>
