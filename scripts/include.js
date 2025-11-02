// small loader to fetch partials and notify app
(async () => {
  async function loadPartial(url, containerId) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Partial not found: ' + url);
      const html = await res.text();
      const container = document.getElementById(containerId);
      if (!container) return;
      container.innerHTML = html;
      // notify listeners that the partial was inserted
      document.dispatchEvent(new CustomEvent('partial-loaded', { detail: { url, containerId } }));
    } catch (err) {
      console.error('Error loading partial:', err);
    }
  }

  // Attach a listener to wire up behaviors when partials are inserted.
  // We attach the listener before loading so it catches the event fired by loadPartial.
  document.addEventListener('partial-loaded', (e) => {
    try {
      const { containerId } = e.detail || {};

      // --- sidebar toggle wiring ---
      if (containerId === 'sidebar') {
        const toggleBtn = document.getElementById('toggle-sidebar-btn');
        const sidebarContainer = document.getElementById('sidebar');
        if (toggleBtn && sidebarContainer) {
          toggleBtn.addEventListener('click', () => {
            const hidden = sidebarContainer.classList.toggle('d-none');

            // When hidden, create a small floating show button so the user can reopen the sidebar
            if (hidden) {
              if (!document.getElementById('show-sidebar-btn')) {
                const showBtn = document.createElement('button');
                showBtn.id = 'show-sidebar-btn';
                showBtn.className = 'btn btn-primary position-fixed top-50 start-0 translate-middle-y';
                showBtn.style.zIndex = '2000';
                showBtn.style.width = '36px';
                showBtn.style.height = '36px';
                showBtn.style.padding = '0';
                showBtn.title = 'Mostrar sidebar';
                showBtn.innerHTML = '<i class="bi bi-chevron-right"></i>';
                showBtn.addEventListener('click', () => {
                  sidebarContainer.classList.remove('d-none');
                  showBtn.remove();
                });
                document.body.appendChild(showBtn);
              }
            } else {
              const showBtn = document.getElementById('show-sidebar-btn');
              if (showBtn) showBtn.remove();
            }
          });
        }
      }

      // --- header: mark all notifications as read ---
      if (containerId === 'header') {
        const markBtn = document.getElementById('mark-all-read');
        if (markBtn) {
          markBtn.addEventListener('click', () => {
            try {
              const notifList = document.getElementById('notif-list');
              const notifCount = document.getElementById('notif-count');
              const notifMenu = document.getElementById('notif-menu');
              const notifBell = document.getElementById('notif-bell');

              // Replace the list with a friendly 'no notifications' message
              if (notifList) {
                notifList.innerHTML = '<div class="px-3 py-3 text-center text-secondary small">No hay notificaciones</div>';
              }

              // Hide the badge / count
              if (notifCount) {
                notifCount.textContent = '';
                notifCount.classList.add('d-none');
              }

              // Close the dropdown if it's open (uses Bootstrap's Dropdown API if available)
              try {
                if (typeof bootstrap !== 'undefined' && notifBell) {
                  const bs = bootstrap.Dropdown.getInstance(notifBell) || new bootstrap.Dropdown(notifBell);
                  bs.hide();
                }
              } catch (err) {
                // ignore dropdown close errors
              }
            } catch (err) {
              console.error('Error marking notifications as read:', err);
            }
          });
        }
      }
    } catch (err) {
      console.error('Error wiring partial behaviors:', err);
    }
  });

  // load both sidebar and header
  await Promise.all([
    loadPartial('partials/sidebar.html', 'sidebar'),
    loadPartial('partials/header.html', 'header')
  ]);
})();