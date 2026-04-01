document.addEventListener('DOMContentLoaded', function () {

  // ===== Highlight active nav item based on current URL =====
  var navItems = document.querySelectorAll('.sidebar .nav-item');
  var currentPath = window.location.pathname;

  navItems.forEach(function (item) {
    item.classList.remove('active');
    var href = item.getAttribute('href');
    if (href && href !== '#' && currentPath.indexOf(href) !== -1) {
      item.classList.add('active');
    }
  });

  // If no match found, default to Dashboard
  var hasActive = document.querySelector('.sidebar .nav-item.active');
  if (!hasActive && navItems.length > 0) {
    navItems[0].classList.add('active');
  }

  // ===== Logout button =====
  var logoutBtn = document.querySelector('.btn-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function () {
      if (confirm('Are you sure you want to logout?')) {
        window.location.href = '/logout';
      }
    });
  }

});