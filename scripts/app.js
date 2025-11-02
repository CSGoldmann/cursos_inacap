// Shared client-side behaviour for pages in the project
(function () {
  let inited = false;

  function initApp() {
    if (inited) return;
    inited = true;

    // -- Login --
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            // TODO: authenticate against backend
            window.location.href = 'index.html';
        });
    }

    // -- Logout (redirect to login) --
    const logoutButton = document.getElementById('logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', (e) => {
            e.preventDefault();
            // TODO: clear session on server/localStorage
            window.location.href = 'login.html';
        });
    }

    // -- Profile: image preview, edit buttons, per-field edit/save/cancel --
    const profilePicInput = document.getElementById('profile-pic-input');
    const profilePicPreview = document.getElementById('profile-pic-preview');
    const removePhotoBtn = document.getElementById('remove-photo');
    const editPictureBtn = document.getElementById('edit-picture');

    if (profilePicInput && profilePicPreview) {
        if (editPictureBtn) {
            editPictureBtn.addEventListener('click', () => profilePicInput.click());
        }
        profilePicInput.addEventListener('change', (e) => {
            const file = e.target.files && e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => profilePicPreview.src = ev.target.result;
            reader.readAsDataURL(file);
            // TODO: upload to server and persist
        });
    }
    if (removePhotoBtn && profilePicPreview) {
        removePhotoBtn.addEventListener('click', () => {
            profilePicPreview.src = 'Pictures/inacap.png';
            if (profilePicInput) profilePicInput.value = '';
        });
    }

    // Per-field edit controls
    const editButtons = document.querySelectorAll('.edit-btn');
    if (editButtons.length) {
        function enterEditMode(field) {
            if (field === 'password') {
                document.getElementById('display-password')?.classList.add('hidden');
                document.getElementById('edit-password-area')?.classList.remove('hidden');
            } else if (field === 'birthday') {
                const d = document.getElementById('display-birthday');
                const input = document.getElementById('input-birthday');
                if (!d || !input) return;
                input.value = (d.textContent === 'No especificada') ? '' : d.textContent;
                d.classList.add('hidden'); input.classList.remove('hidden');
            } else if (field === 'address') {
                const d = document.getElementById('display-address');
                const input = document.getElementById('input-address');
                if (!d || !input) return;
                input.value = (d.textContent === 'Calle, número, ciudad') ? '' : d.textContent;
                d.classList.add('hidden'); input.classList.remove('hidden');
            }
        }
        function exitEditMode(field, saved = false) {
            if (field === 'password') {
                document.getElementById('edit-password-area')?.classList.add('hidden');
                const display = document.getElementById('display-password');
                if (saved && display) display.textContent = '••••••••';
                display?.classList.remove('hidden');
                document.getElementById('current-password')?.value = '';
                document.getElementById('new-password')?.value = '';
            } else if (field === 'birthday') {
                const d = document.getElementById('display-birthday');
                const input = document.getElementById('input-birthday');
                if (saved && input && input.value) d.textContent = input.value;
                d?.classList.remove('hidden'); input?.classList.add('hidden');
            } else if (field === 'address') {
                const d = document.getElementById('display-address');
                const input = document.getElementById('input-address');
                if (saved && input && input.value) d.textContent = input.value;
                d?.classList.remove('hidden'); input?.classList.add('hidden');
            }
        }
        editButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const field = btn.getAttribute('data-field');
                if (btn.dataset.mode !== 'editing') {
                    enterEditMode(field);
                    btn.dataset.prevText = btn.textContent;
                    btn.textContent = 'Guardar';
                    btn.dataset.mode = 'editing';
                    const cancel = document.createElement('button');
                    cancel.type = 'button';
                    cancel.textContent = 'Cancelar';
                    cancel.className = 'cancel-btn ml-2 px-3 py-1 text-sm border rounded-lg';
                    btn.parentElement.appendChild(cancel);
                    cancel.addEventListener('click', () => {
                        exitEditMode(field, false);
                        btn.textContent = btn.dataset.prevText || 'Editar';
                        btn.dataset.mode = '';
                        cancel.remove();
                    });
                } else {
                    // Save (client-only)
                    if (field === 'password') {
                        const newPass = document.getElementById('new-password')?.value;
                        if (!newPass) { alert('Ingrese una nueva contraseña.'); return; }
                        // TODO: API call
                        exitEditMode('password', true);
                        alert('Contraseña actualizada (simulado).');
                    } else if (field === 'birthday') {
                        const input = document.getElementById('input-birthday');
                        if (!input || !input.value) { alert('Seleccione una fecha.'); return; }
                        // TODO: API call
                        exitEditMode('birthday', true);
                        alert('Fecha de nacimiento actualizada (simulado).');
                    } else if (field === 'address') {
                        const input = document.getElementById('input-address');
                        if (!input || !input.value) { alert('Ingrese una dirección.'); return; }
                        // TODO: API call
                        exitEditMode('address', true);
                        alert('Dirección actualizada (simulado).');
                    }
                    btn.textContent = btn.dataset.prevText || 'Editar';
                    btn.dataset.mode = '';
                    const cancelBtn = btn.parentElement.querySelector('.cancel-btn');
                    if (cancelBtn) cancelBtn.remove();
                }
            });
        });
    }

    // -- Notifications bell (dropdown & clicks) --
    const notifList = document.getElementById('notif-list');
    const notifCountEl = document.getElementById('notif-count');
    
    if (notifList && notifCountEl) {
        notifList.addEventListener('click', (e) => {
            const item = e.target.closest('.notification-item');
            if (!item) return;
            e.preventDefault();
            
            const id = item.getAttribute('data-id');
            console.log('Notification clicked:', id);
            
            // Mark as read
            item.classList.add('bg-light', 'text-secondary');
            
            // Update counter
            const current = parseInt(notifCountEl.textContent || '0', 10);
            const next = Math.max(0, current - 1);
            notifCountEl.textContent = String(next);
            if (next === 0) {
                notifCountEl.classList.add('d-none');
            }
            
            // Close dropdown using Bootstrap's API
            const dropdown = bootstrap.Dropdown.getInstance(document.getElementById('notif-bell'));
            if (dropdown) {
                dropdown.hide();
            }
        });
    }

            // -- Nav active link highlight --
            const navLinks = document.querySelectorAll('.nav-link');
            if (navLinks.length) {
                    const current = location.pathname.split('/').pop() || 'index.html';
                    navLinks.forEach(a => {
                            const href = a.getAttribute('href') || '';
                            if (href === current) a.classList.add('bg-blue-50');
                            else a.classList.remove('bg-blue-50');
                    });
            }
  }

  // Run when the DOM is ready
  document.addEventListener('DOMContentLoaded', initApp);
  // Also run if a partial was loaded after DOMContentLoaded
  document.addEventListener('partial-loaded', initApp);
})();