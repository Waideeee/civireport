document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('admin-search');
    const statusFilter = document.getElementById('admins-status-filter');
    const tableBody = document.getElementById('admins-tbody');
    const adminRows = document.querySelectorAll('.admin-row');
    
    // Sort rows initially: Active first, Deactivated at bottom
    function sortRows() {
        const rows = Array.from(document.querySelectorAll('.admin-row'));
        rows.sort((a, b) => {
            const statusA = a.getAttribute('data-status');
            const statusB = b.getAttribute('data-status');
            if (statusA === 'active' && statusB === 'deactivated') return -1;
            if (statusA === 'deactivated' && statusB === 'active') return 1;
            return 0;
        });
        rows.forEach(row => tableBody.appendChild(row));
    }
    sortRows();

    // Real-time Search Logic
    function filterAdmins() {
        const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
        const selectedStatus = statusFilter ? statusFilter.value : 'all';
        let visibleCount = 0;

        document.querySelectorAll('.admin-row').forEach(row => {
            const name = row.getAttribute('data-name');
            const email = row.getAttribute('data-email');
            const status = row.getAttribute('data-status');

            const matchesSearch = name.includes(query) || email.includes(query);
            const matchesStatus = selectedStatus === 'all' || status === selectedStatus;

            if (matchesSearch && matchesStatus) {
                row.style.display = '';
                visibleCount++;
            } else {
                row.style.display = 'none';
            }
        });

        // Handle empty state
        const noResultsRow = document.getElementById('no-results-row');
        if (visibleCount === 0) {
            if (!noResultsRow) {
                const tr = document.createElement('tr');
                tr.id = 'no-results-row';
                tr.innerHTML = `<td colspan="6" class="empty-state">No admins found matching your criteria.</td>`;
                tableBody.appendChild(tr);
            }
        } else {
            if (noResultsRow) noResultsRow.remove();
        }
    }

    if (searchInput) searchInput.addEventListener('input', filterAdmins);
    if (statusFilter) statusFilter.addEventListener('change', filterAdmins);

    // Profile Modal Logic
    const detailsModal = document.getElementById('admin-details-modal');
    
    document.querySelectorAll('.admin-row').forEach(row => {
        row.addEventListener('click', function(e) {
            if (e.target.closest('button') || e.target.closest('form')) return;

            const data = JSON.parse(this.getAttribute('data-details'));
            document.getElementById('modal-name').textContent = data.user_name;
            document.getElementById('modal-email').textContent = data.email;
            document.getElementById('modal-gender').textContent = data.gender || 'N/A';
            document.getElementById('modal-barangay').textContent = data.barangay || data.address || 'N/A';
            document.getElementById('modal-contact').textContent = data.contact_num || 'N/A';
            document.getElementById('modal-address').textContent = data.address || 'N/A';
            document.getElementById('modal-date').textContent = data.date_registered;
            
            const statusP = document.getElementById('modal-status');
            statusP.innerHTML = `<span class="badge ${data.is_active ? 'badge-approved' : 'badge-rejected'}">${data.is_active ? 'Active' : 'Inactive'}</span>`;

            const photoImg = document.getElementById('modal-photo');
            if (data.profile_photo_url) {
                photoImg.src = data.profile_photo_url;
            } else {
                photoImg.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(data.user_name)}&color=7F9CF5&background=EBF4FF`;
            }

            detailsModal.style.display = 'flex';
        });
    });

    // Deactivate Modal Logic
    const deactivateModal = document.getElementById('deactivate-modal');
    const deactivateForm = document.getElementById('deactivate-form');
    const deactivateNameSpan = document.getElementById('deactivate-admin-name');

    document.querySelectorAll('.btn-confirm-deactivate').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            const name = this.getAttribute('data-name');
            deactivateNameSpan.textContent = name;
            deactivateForm.action = `/superadmin/users/${id}/deactivate`;
            deactivateModal.style.display = 'flex';
        });
    });

    // Universal Close Modal Logic
    document.querySelectorAll('.modal-close, .modal-cancel-btn').forEach(el => {
        el.addEventListener('click', () => {
            if (detailsModal) detailsModal.style.display = 'none';
            if (deactivateModal) deactivateModal.style.display = 'none';
        });
    });

    window.addEventListener('click', (e) => {
        if (e.target === detailsModal) detailsModal.style.display = 'none';
        if (e.target === deactivateModal) deactivateModal.style.display = 'none';
    });
});
