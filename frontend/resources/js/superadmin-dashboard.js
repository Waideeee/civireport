document.addEventListener('DOMContentLoaded', function() {
    // Confirmation Modals Logic
    const approveModal = document.getElementById('approve-modal');
    const rejectModal = document.getElementById('reject-modal');
    const approveForm = document.getElementById('approve-form');
    const rejectForm = document.getElementById('reject-form');
    const approveNameSpan = document.getElementById('approve-admin-name');
    const rejectNameSpan = document.getElementById('reject-admin-name');
    const modalCloseElements = document.querySelectorAll('.modal-close, .modal-cancel-btn');

    // Approve Modal Trigger
    document.querySelectorAll('.btn-confirm-approve').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            const name = this.getAttribute('data-name');
            approveNameSpan.textContent = name;
            approveForm.action = `/superadmin/users/${id}/approve`;
            approveModal.style.display = 'flex';
        });
    });

    // Reject Modal Trigger
    document.querySelectorAll('.btn-confirm-reject').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            const name = this.getAttribute('data-name');
            rejectNameSpan.textContent = name;
            rejectForm.action = `/superadmin/users/${id}/reject`;
            rejectModal.style.display = 'flex';
        });
    });

    // Close Modals Logic
    modalCloseElements.forEach(el => {
        el.addEventListener('click', () => {
            approveModal.style.display = 'none';
            rejectModal.style.display = 'none';
        });
    });

    window.addEventListener('click', (e) => {
        if (e.target === approveModal) approveModal.style.display = 'none';
        if (e.target === rejectModal) rejectModal.style.display = 'none';
    });
});
