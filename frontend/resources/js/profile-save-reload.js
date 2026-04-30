/**
 * Profile Save Reload
 * Reloads the page after a Livewire 'saved' event on the profile update form
 * to ensure the sidebar avatar and name reflect the latest changes.
 */
document.addEventListener('livewire:initialized', () => {
    Livewire.on('saved', () => {
        setTimeout(() => {
            window.location.reload();
        }, 800);
    });
});
