// scripts/ui.js
(() => {
  const THEME_MAP = {
    success: { bg: '#198754', fg: '#ffffff', icon: 'bi-check-circle-fill' },
    danger: { bg: '#dc3545', fg: '#ffffff', icon: 'bi-exclamation-octagon-fill' },
    warning: { bg: '#ffc107', fg: '#212529', icon: 'bi-exclamation-triangle-fill' },
    info: { bg: '#0d6efd', fg: '#ffffff', icon: 'bi-info-circle-fill' },
    default: { bg: '#0d6efd', fg: '#ffffff', icon: 'bi-info-circle-fill' }
  };

  const STYLE_ID = 'global-toast-styles';
  const CONTAINER_ID = 'global-toast-container';

  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      #${CONTAINER_ID} {
        position: fixed;
        inset: 1.25rem 0 auto 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.75rem;
        z-index: 2147483000;
        pointer-events: none;
        padding: 0 1rem;
      }
      @media (min-width: 992px) {
        #${CONTAINER_ID} {
          inset: 1.75rem auto auto 50%;
          transform: translateX(-50%);
          max-width: min(420px, calc(100vw - 3rem));
        }
      }
      .global-toast {
        width: min(420px, 100%);
        background-color: #0d6efd;
        color: #ffffff;
        border-radius: 0.75rem;
        box-shadow: 0 1rem 3rem rgba(15, 23, 42, 0.18);
        padding: 0.9rem 1.1rem;
        display: flex;
        align-items: flex-start;
        gap: 0.75rem;
        pointer-events: auto;
        opacity: 0;
        transform: translateY(-8px) scale(0.98);
        transition: opacity 0.25s ease, transform 0.25s ease;
      }
      .global-toast.show {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
      .global-toast .toast-icon {
        font-size: 1.3rem;
        line-height: 1;
      }
      .global-toast .toast-body {
        flex: 1;
      }
      .global-toast .toast-body strong {
        display: block;
        margin-bottom: 0.25rem;
        font-weight: 600;
      }
      .global-toast .toast-close {
        background: transparent;
        border: 0;
        color: inherit;
        font-size: 1.1rem;
        cursor: pointer;
        opacity: 0.8;
        line-height: 1;
      }
      .global-toast .toast-close:hover {
        opacity: 1;
      }
    `;
    document.head.appendChild(style);
  }

  function ensureContainer() {
    let container = document.getElementById(CONTAINER_ID);
    if (container) return container;
    container = document.createElement('div');
    container.id = CONTAINER_ID;
    document.body.appendChild(container);
    return container;
  }

  function resolveTheme(type) {
    return THEME_MAP[type] || THEME_MAP.default;
  }

  function showToast(message, options = {}) {
    const {
      type = 'info',
      title = null,
      duration = 4200,
      preserveHtml = false
    } = options;

    ensureStyles();
    const container = ensureContainer();
    const theme = resolveTheme(type);

    const toast = document.createElement('div');
    toast.className = 'global-toast';
    toast.style.backgroundColor = theme.bg;
    toast.style.color = theme.fg;

    toast.innerHTML = `
      <i class="toast-icon bi ${theme.icon}"></i>
      <div class="toast-body"></div>
      <button class="toast-close" aria-label="Cerrar">
        <i class="bi bi-x-lg"></i>
      </button>
    `;

    const body = toast.querySelector('.toast-body');
    if (title) {
      const strong = document.createElement('strong');
      strong.textContent = title;
      body.appendChild(strong);
    }

    if (preserveHtml) {
      body.insertAdjacentHTML('beforeend', message);
    } else {
      const paragraph = document.createElement('span');
      paragraph.textContent = message;
      body.appendChild(paragraph);
    }

    const closeBtn = toast.querySelector('.toast-close');
    const removeToast = () => {
      toast.classList.remove('show');
      setTimeout(() => {
        toast.remove();
        if (!container.children.length) {
          container.remove();
        }
      }, 220);
    };

    closeBtn.addEventListener('click', (event) => {
      event.preventDefault();
      removeToast();
    });

    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('show'));

    if (duration > 0) {
      setTimeout(removeToast, duration);
    }

    return removeToast;
  }

  function wrap(fnType, defaultTitle) {
    return (message, opts = {}) =>
      showToast(message, { ...opts, type: fnType, title: opts.title ?? defaultTitle });
  }

  window.toast = {
    show: showToast,
    info: wrap('info', null),
    success: wrap('success', 'Éxito'),
    warning: wrap('warning', 'Atención'),
    danger: wrap('danger', 'Error'),
    error: wrap('danger', 'Error')
  };

  const originalAlert = window.alert.bind(window);
  window.alert = (message) => {
    showToast(message, { type: 'warning' });
    return message;
  };

  window.mostrarToast = showToast;
  window.mostrarToastExito = wrap('success', 'Éxito');
  window.mostrarToastError = wrap('danger', 'Error');
  window.mostrarToastInfo = wrap('info', null);

  document.addEventListener('DOMContentLoaded', () => {
    ensureStyles();
  });
})();

