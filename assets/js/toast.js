// Toast Notification Utility
// Usage: Toast.success('Message'), Toast.error('Error'), Toast.warning('Warning'), Toast.info('Info')

const Toast = (() => {
  let container = null;
  const defaultOptions = {
    duration: 4000,
    position: 'top-right',
    closeButton: true,
    progressBar: true,
    pauseOnHover: true,
    animation: 'slide'
  };

  function createContainer() {
    if (container) return container;
    
    container = document.createElement('div');
    container.id = 'toast-container';
    container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      pointer-events: none;
    `;
    document.body.appendChild(container);
    return container;
  }

  function getIcon(type) {
    const icons = {
      success: '<i class="fas fa-check-circle"></i>',
      error: '<i class="fas fa-times-circle"></i>',
      warning: '<i class="fas fa-exclamation-triangle"></i>',
      info: '<i class="fas fa-info-circle"></i>',
      loading: '<i class="fas fa-spinner fa-spin"></i>'
    };
    return icons[type] || icons.info;
  }

  function getColor(type) {
    const colors = {
      success: { bg: '#10b981', border: '#059669' },
      error: { bg: '#ef4444', border: '#dc2626' },
      warning: { bg: '#f59e0b', border: '#d97706' },
      info: { bg: '#3b82f6', border: '#2563eb' },
      loading: { bg: '#6366f1', border: '#4f46e5' }
    };
    return colors[type] || colors.info;
  }

  function show(message, type = 'info', options = {}) {
    const opts = { ...defaultOptions, ...options };
    const container = createContainer();
    const color = getColor(type);
    
    const toast = document.createElement('div');
    toast.className = 'toast-item';
    toast.style.cssText = `
      background: ${color.bg};
      color: white;
      padding: 14px 18px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      display: flex;
      align-items: flex-start;
      gap: 12px;
      min-width: 280px;
      max-width: 420px;
      pointer-events: auto;
      animation: toastSlideIn 0.3s ease-out;
      border-left: 4px solid ${color.border};
      font-size: 14px;
      line-height: 1.5;
    `;
    
    // Add animation keyframes if not exists
    if (!document.getElementById('toast-styles')) {
      const style = document.createElement('style');
      style.id = 'toast-styles';
      style.textContent = `
        @keyframes toastSlideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes toastSlideOut {
          from { transform: translateX(0); opacity: 1; }
          to { transform: translateX(100%); opacity: 0; }
        }
        @keyframes toastProgress {
          from { width: 100%; }
          to { width: 0%; }
        }
        .toast-item.removing { animation: toastSlideOut 0.3s ease-in forwards; }
        .toast-progress { height: 3px; background: rgba(255,255,255,0.4); border-radius: 0 0 8px 8px; margin: 0 -18px -18px -18px; }
        .toast-close { background: none; border: none; color: white; opacity: 0.7; cursor: pointer; padding: 2px; font-size: 16px; line-height: 1; }
        .toast-close:hover { opacity: 1; }
      `;
      document.head.appendChild(style);
    }

    toast.innerHTML = `
      <div style="font-size: 18px; flex-shrink: 0;">${getIcon(type)}</div>
      <div style="flex: 1;">${message}</div>
      ${opts.closeButton ? '<button class="toast-close" aria-label="Close">&times;</button>' : ''}
      ${opts.progressBar ? '<div class="toast-progress" style="width: 100%;"></div>' : ''}
    `;

    container.appendChild(toast);

    // Progress bar animation
    let progressBar = toast.querySelector('.toast-progress');
    if (progressBar && opts.duration > 0) {
      progressBar.style.transition = `width ${opts.duration}ms linear`;
      // Force reflow
      progressBar.offsetWidth;
      progressBar.style.width = '0%';
    }

    // Close button
    const closeBtn = toast.querySelector('.toast-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => removeToast(toast));
    }

    // Auto remove
    if (opts.duration > 0) {
      const timer = setTimeout(() => removeToast(toast), opts.duration);
      toast.dataset.timer = timer;
    }

    // Pause on hover
    if (opts.pauseOnHover) {
      toast.addEventListener('mouseenter', () => {
        if (progressBar) progressBar.style.animationPlayState = 'paused';
        if (toast.dataset.timer) clearTimeout(parseInt(toast.dataset.timer));
      });
      toast.addEventListener('mouseleave', () => {
        if (progressBar) progressBar.style.animationPlayState = 'running';
        if (opts.duration > 0) {
          const timer = setTimeout(() => removeToast(toast), opts.duration);
          toast.dataset.timer = timer;
        }
      });
    }

    return toast;
  }

  function removeToast(toast) {
    if (!toast || toast.classList.contains('removing')) return;
    toast.classList.add('removing');
    setTimeout(() => toast.remove(), 300);
  }

  function clear() {
    if (container) {
      container.querySelectorAll('.toast-item').forEach(removeToast);
    }
  }

  return {
    success: (msg, opts) => show(msg, 'success', opts),
    error: (msg, opts) => show(msg, 'error', opts),
    warning: (msg, opts) => show(msg, 'warning', opts),
    info: (msg, opts) => show(msg, 'info', opts),
    loading: (msg, opts) => show(msg, 'loading', { ...opts, duration: 0, closeButton: false }),
    clear
  };
})();

// Export globally
window.Toast = Toast;

// For module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Toast;
}