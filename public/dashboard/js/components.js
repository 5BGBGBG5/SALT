// Shared Components and Utilities

class ComponentUtils {
  static formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  static formatNumber(num) {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  static truncateText(text, length = 100) {
    if (text.length <= length) return text;
    return text.substring(0, length) + '...';
  }

  static debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  static throttle(func, limit) {
    let inThrottle;
    return function() {
      const args = arguments;
      const context = this;
      if (!inThrottle) {
        func.apply(context, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  static generateId(prefix = 'id') {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
  }

  static sanitizeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  static copyToClipboard(text) {
    if (navigator.clipboard) {
      return navigator.clipboard.writeText(text);
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return Promise.resolve();
    }
  }

  static downloadJSON(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  static downloadCSV(data, filename) {
    if (!Array.isArray(data) || data.length === 0) return;
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Escape commas and quotes
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

// Toast Notification System
class ToastManager {
  constructor() {
    this.container = null;
    this.toasts = new Map();
    this.init();
  }

  init() {
    this.container = document.createElement('div');
    this.container.className = 'toast-container';
    this.container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: var(--z-tooltip);
      display: flex;
      flex-direction: column;
      gap: var(--space-sm);
      pointer-events: none;
    `;
    document.body.appendChild(this.container);
  }

  show(message, type = 'info', duration = 4000) {
    const id = ComponentUtils.generateId('toast');
    const toast = document.createElement('div');
    
    const colors = {
      success: 'var(--success)',
      error: 'var(--danger)',
      warning: 'var(--warning)',
      info: 'var(--info)'
    };

    const icons = {
      success: 'check-circle',
      error: 'alert-circle',
      warning: 'alert-triangle',
      info: 'info'
    };

    toast.className = 'toast';
    toast.style.cssText = `
      background: ${colors[type] || colors.info};
      color: white;
      padding: var(--space-md);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-lg);
      display: flex;
      align-items: center;
      gap: var(--space-sm);
      max-width: 400px;
      pointer-events: auto;
      transform: translateX(100%);
      transition: transform var(--transition-normal);
      cursor: pointer;
    `;

    toast.innerHTML = `
      <i data-lucide="${icons[type] || icons.info}" style="width: 20px; height: 20px; flex-shrink: 0;"></i>
      <span style="flex: 1; font-weight: 500;">${ComponentUtils.sanitizeHtml(message)}</span>
      <i data-lucide="x" style="width: 16px; height: 16px; opacity: 0.7; cursor: pointer;"></i>
    `;

    this.container.appendChild(toast);
    this.toasts.set(id, toast);

    // Initialize Lucide icons
    if (window.lucide) {
      window.lucide.createIcons();
    }

    // Animate in
    requestAnimationFrame(() => {
      toast.style.transform = 'translateX(0)';
    });

    // Click to dismiss
    toast.addEventListener('click', () => this.hide(id));

    // Auto dismiss
    if (duration > 0) {
      setTimeout(() => this.hide(id), duration);
    }

    return id;
  }

  hide(id) {
    const toast = this.toasts.get(id);
    if (!toast) return;

    toast.style.transform = 'translateX(100%)';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
      this.toasts.delete(id);
    }, 250);
  }

  success(message, duration) {
    return this.show(message, 'success', duration);
  }

  error(message, duration) {
    return this.show(message, 'error', duration);
  }

  warning(message, duration) {
    return this.show(message, 'warning', duration);
  }

  info(message, duration) {
    return this.show(message, 'info', duration);
  }
}

// Modal System
class ModalManager {
  constructor() {
    this.modals = new Map();
    this.activeModal = null;
    this.init();
  }

  init() {
    // Handle escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.activeModal) {
        this.hide(this.activeModal);
      }
    });
  }

  create(id, content, options = {}) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: var(--z-modal);
      opacity: 0;
      visibility: hidden;
      transition: all var(--transition-normal);
      padding: var(--space-lg);
    `;

    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    modalContent.style.cssText = `
      background: var(--surface);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-xl);
      max-width: ${options.maxWidth || '600px'};
      max-height: 90vh;
      overflow-y: auto;
      transform: scale(0.9);
      transition: transform var(--transition-normal);
      width: 100%;
    `;

    modalContent.innerHTML = content;
    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // Close on overlay click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.hide(id);
      }
    });

    this.modals.set(id, modal);
    return id;
  }

  show(id) {
    const modal = this.modals.get(id);
    if (!modal) return;

    this.activeModal = id;
    modal.style.opacity = '1';
    modal.style.visibility = 'visible';
    
    const content = modal.querySelector('.modal-content');
    if (content) {
      content.style.transform = 'scale(1)';
    }

    // Prevent body scroll
    document.body.style.overflow = 'hidden';
  }

  hide(id) {
    const modal = this.modals.get(id);
    if (!modal) return;

    modal.style.opacity = '0';
    modal.style.visibility = 'hidden';
    
    const content = modal.querySelector('.modal-content');
    if (content) {
      content.style.transform = 'scale(0.9)';
    }

    // Restore body scroll
    document.body.style.overflow = '';
    
    this.activeModal = null;
  }

  destroy(id) {
    const modal = this.modals.get(id);
    if (modal && modal.parentNode) {
      modal.parentNode.removeChild(modal);
    }
    this.modals.delete(id);
  }
}

// Loading Manager
class LoadingManager {
  constructor() {
    this.loadingStates = new Set();
    this.overlay = null;
  }

  show(message = 'Loading...') {
    if (!this.overlay) {
      this.overlay = document.createElement('div');
      this.overlay.className = 'loading-overlay';
      this.overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(255, 255, 255, 0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: var(--z-modal);
        opacity: 0;
        transition: opacity var(--transition-normal);
      `;

      this.overlay.innerHTML = `
        <div style="text-align: center;">
          <div class="spinner large"></div>
          <p style="margin-top: var(--space-md); color: var(--text-secondary); font-weight: 500;">${message}</p>
        </div>
      `;

      document.body.appendChild(this.overlay);
    }

    requestAnimationFrame(() => {
      this.overlay.style.opacity = '1';
    });

    document.body.style.overflow = 'hidden';
  }

  hide() {
    if (this.overlay) {
      this.overlay.style.opacity = '0';
      setTimeout(() => {
        if (this.overlay && this.overlay.parentNode) {
          this.overlay.parentNode.removeChild(this.overlay);
          this.overlay = null;
        }
        document.body.style.overflow = '';
      }, 250);
    }
  }

  setMessage(message) {
    if (this.overlay) {
      const p = this.overlay.querySelector('p');
      if (p) {
        p.textContent = message;
      }
    }
  }
}

// Initialize global instances
window.ComponentUtils = ComponentUtils;
window.toast = new ToastManager();
window.modal = new ModalManager();
window.loading = new LoadingManager();

// Initialize Lucide icons when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  if (window.lucide) {
    window.lucide.createIcons();
  }
});
