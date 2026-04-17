document.addEventListener('DOMContentLoaded', function () {



  // ===== Logout button =====
  var logoutBtn = document.querySelector('.btn-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function () {
      if (confirm('Are you sure you want to logout?')) {
        var form = document.createElement('form');
        form.method = 'POST';
        form.action = '/logout';

        var csrfToken = document.querySelector('meta[name="csrf-token"]').content;
        var input = document.createElement('input');
        input.type = 'hidden';
        input.name = '_token';
        input.value = csrfToken;

        form.appendChild(input);
        document.body.appendChild(form);
        form.submit();
      }
    });
  }

});