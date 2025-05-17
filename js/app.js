document.addEventListener('DOMContentLoaded', function () {
  const menuButton = document.querySelector('.menu-button');
  const closeButton = document.querySelector('.close-sidebar');
  const sidebar = document.querySelector('.sidebar');
  const overlay = document.querySelector('.sidebar-overlay');
  function openSidebar() {
      sidebar.classList.add('show');
      overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
  }
  function closeSidebar() {
      sidebar.classList.remove('show');
      overlay.classList.remove('active');
      document.body.style.overflow = '';
  }
  menuButton.addEventListener('click', openSidebar);
  closeButton.addEventListener('click', closeSidebar);
  overlay.addEventListener('click', closeSidebar);
  document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
          closeSidebar();
      }
  });
  if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
          navigator.serviceWorker.register('/service-worker.js')
      });
  }
});
