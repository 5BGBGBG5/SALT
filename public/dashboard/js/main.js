// Main initialization script for all dashboard pages

class DashboardApp {
  constructor() {
    this.currentPage = this.getCurrentPage();
    this.isInitialized = false;
    this.init();
  }

  getCurrentPage() {
    const path = window.location.pathname;
    const filename = path.split('/').pop().split('.')[0];
    
    switch (filename) {
      case 'index':
      case '':
        return 'dashboard';
      case 'competitor':
        return 'competitor';
      case 'compare':
        return 'compare';
      case 'battlecards':
        return 'battlecards';
      case 'insights':
        return 'insights';
      default:
        return 'unknown';
    }
  }

  async init() {
    console.log(`🚀 Initializing SALT Dashboard App - Page: ${this.currentPage}`);
    
    // Wait for all dependencies to load
    await this.waitForDependencies();
    
    // Initialize global features
    this.initializeGlobalFeatures();
    
    // Initialize page-specific features
    this.initializePageFeatures();
    
    // Mark as initialized
    this.isInitialized = true;
    
    console.log('✅ Dashboard App initialized');
    
    // Dispatch ready event
    window.dispatchEvent(new CustomEvent('dashboardReady', {
      detail: { page: this.currentPage }
    }));
  }

  async waitForDependencies() {
    const dependencies = [
      () => window.supabase,
      () => window.Chart,
      () => window.lucide,
      () => window.DASHBOARD_CONFIG
    ];

    const maxAttempts = 50;
    let attempts = 0;

    while (attempts < maxAttempts) {
      const allLoaded = dependencies.every(check => {
        try {
          return check();
        } catch {
          return false;
        }
      });

      if (allLoaded) {
        console.log('✅ All dependencies loaded');
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }

    console.warn('⚠️ Some dependencies may not have loaded properly');
  }

  initializeGlobalFeatures() {
    // Initialize Lucide icons
    if (window.lucide) {
      window.lucide.createIcons();
    }

    // Global error handling
    window.addEventListener('error', (event) => {
      console.error('Global error:', event.error);
      if (window.toast) {
        window.toast.error('An unexpected error occurred');
      }
    });

    // Global unhandled promise rejection handling
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      if (window.toast) {
        window.toast.error('A network or data error occurred');
      }
    });

    // Initialize keyboard shortcuts
    this.initializeKeyboardShortcuts();

    // Initialize theme handling
    this.initializeTheme();

    // Initialize analytics (if needed)
    this.initializeAnalytics();
  }

  initializeKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Global shortcuts
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case '/':
            e.preventDefault();
            this.focusGlobalSearch();
            break;
          case 'k':
            e.preventDefault();
            this.openCommandPalette();
            break;
          case 'r':
            e.preventDefault();
            this.refreshCurrentPage();
            break;
        }
      }

      // Navigation shortcuts
      if (e.altKey) {
        switch (e.key) {
          case '1':
            e.preventDefault();
            window.location.href = 'index.html';
            break;
          case '2':
            e.preventDefault();
            window.location.href = 'competitors.html';
            break;
          case '3':
            e.preventDefault();
            window.location.href = 'compare.html';
            break;
          case '4':
            e.preventDefault();
            window.location.href = 'battlecards.html';
            break;
        }
      }
    });
  }

  focusGlobalSearch() {
    const searchInput = document.getElementById('global-search');
    if (searchInput) {
      searchInput.focus();
      searchInput.select();
    }
  }

  openCommandPalette() {
    // Redirect to main app for command palette
    window.location.href = '../';
  }

  refreshCurrentPage() {
    if (window.dashboard && typeof window.dashboard.refreshDashboard === 'function') {
      window.dashboard.refreshDashboard();
    } else if (window.competitorProfile && typeof window.competitorProfile.refreshData === 'function') {
      window.competitorProfile.refreshData();
    } else {
      window.location.reload();
    }
  }

  initializeTheme() {
    // Check for saved theme preference or default to light
    const savedTheme = localStorage.getItem('dashboard-theme') || 'light';
    this.setTheme(savedTheme);

    // Listen for system theme changes
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', (e) => {
        if (!localStorage.getItem('dashboard-theme')) {
          this.setTheme(e.matches ? 'dark' : 'light');
        }
      });
    }
  }

  setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('dashboard-theme', theme);
  }

  toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    this.setTheme(newTheme);
  }

  initializeAnalytics() {
    // Track page views
    this.trackPageView();

    // Track user interactions
    document.addEventListener('click', (e) => {
      const target = e.target.closest('[data-track]');
      if (target) {
        const action = target.getAttribute('data-track');
        this.trackEvent('click', action, {
          page: this.currentPage,
          element: target.tagName.toLowerCase()
        });
      }
    });
  }

  trackPageView() {
    const data = {
      page: this.currentPage,
      url: window.location.href,
      referrer: document.referrer,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    };

    console.log('📊 Page view:', data);
    
    // Here you would send to your analytics service
    // Example: analytics.track('page_view', data);
  }

  trackEvent(type, action, data = {}) {
    const eventData = {
      type,
      action,
      ...data,
      timestamp: new Date().toISOString(),
      page: this.currentPage
    };

    console.log('📊 Event:', eventData);
    
    // Here you would send to your analytics service
    // Example: analytics.track('event', eventData);
  }

  initializePageFeatures() {
    switch (this.currentPage) {
      case 'dashboard':
        this.initializeDashboardFeatures();
        break;
      case 'competitor':
        this.initializeCompetitorFeatures();
        break;
      case 'compare':
        this.initializeCompareFeatures();
        break;
      default:
        console.log(`No specific features for page: ${this.currentPage}`);
    }
  }

  initializeDashboardFeatures() {
    // Dashboard-specific features
    console.log('🏠 Initializing dashboard features...');
    
    // Add any dashboard-specific global features here
    this.initializeExportFeatures();
  }

  initializeCompetitorFeatures() {
    // Competitor profile specific features
    console.log('👤 Initializing competitor profile features...');
    
    // Add competitor-specific features here
    this.initializeCompetitorActions();
  }

  initializeCompareFeatures() {
    // Comparison page specific features
    console.log('⚖️ Initializing comparison features...');
    
    // Add comparison-specific features here
  }

  initializeExportFeatures() {
    const exportButton = document.getElementById('export-data');
    if (exportButton) {
      exportButton.addEventListener('click', async () => {
        try {
          window.loading.show('Preparing export...');
          
          // Get all dashboard data
          const data = await this.gatherExportData();
          
          // Create export
          const filename = `dashboard-export-${new Date().toISOString().split('T')[0]}.json`;
          ComponentUtils.downloadJSON(data, filename);
          
          window.toast.success('Dashboard data exported successfully');
        } catch (error) {
          console.error('Export error:', error);
          window.toast.error('Failed to export data');
        } finally {
          window.loading.hide();
        }
      });
    }
  }

  async gatherExportData() {
    const data = {
      exportedAt: new Date().toISOString(),
      exportedBy: 'SALT Dashboard',
      version: '1.0.0'
    };

    try {
      if (window.supabaseClient) {
        const [stats, competitors, activity] = await Promise.all([
          window.supabaseClient.getDashboardStats(),
          window.supabaseClient.getCompetitors(),
          window.supabaseClient.getRecentActivity(50)
        ]);

        data.stats = stats;
        data.competitors = competitors;
        data.activity = activity;
      }
    } catch (error) {
      console.error('Error gathering export data:', error);
      data.error = 'Some data could not be exported';
    }

    return data;
  }

  initializeCompetitorActions() {
    // Add competitor-specific action handlers
    const competitorCards = document.querySelectorAll('.competitor-card');
    competitorCards.forEach(card => {
      card.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        this.showCompetitorContextMenu(e, card);
      });
    });
  }

  showCompetitorContextMenu(event, card) {
    // Create context menu for competitor actions
    const menu = document.createElement('div');
    menu.className = 'context-menu';
    menu.style.cssText = `
      position: fixed;
      top: ${event.clientY}px;
      left: ${event.clientX}px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-lg);
      z-index: var(--z-popover);
      padding: var(--space-xs);
      min-width: 200px;
    `;

    const competitorName = card.querySelector('.competitor-name')?.textContent;
    
    menu.innerHTML = `
      <div class="context-menu-item" data-action="view">
        <i data-lucide="eye"></i>
        View Profile
      </div>
      <div class="context-menu-item" data-action="compare">
        <i data-lucide="git-compare"></i>
        Compare
      </div>
      <div class="context-menu-item" data-action="export">
        <i data-lucide="download"></i>
        Export Data
      </div>
      <div class="context-menu-divider"></div>
      <div class="context-menu-item" data-action="refresh">
        <i data-lucide="refresh-cw"></i>
        Refresh
      </div>
    `;

    // Add styles for menu items
    const style = document.createElement('style');
    style.textContent = `
      .context-menu-item {
        display: flex;
        align-items: center;
        gap: var(--space-sm);
        padding: var(--space-sm);
        cursor: pointer;
        border-radius: var(--radius-sm);
        font-size: var(--text-sm);
        color: var(--text-primary);
        transition: background-color var(--transition-fast);
      }
      .context-menu-item:hover {
        background: var(--surface-hover);
      }
      .context-menu-divider {
        height: 1px;
        background: var(--border);
        margin: var(--space-xs) 0;
      }
    `;
    document.head.appendChild(style);

    document.body.appendChild(menu);

    // Handle menu actions
    menu.addEventListener('click', (e) => {
      const action = e.target.closest('.context-menu-item')?.getAttribute('data-action');
      if (action && competitorName) {
        this.handleCompetitorAction(action, competitorName);
      }
      document.body.removeChild(menu);
      document.head.removeChild(style);
    });

    // Close menu on outside click
    const closeMenu = (e) => {
      if (!menu.contains(e.target)) {
        document.body.removeChild(menu);
        document.head.removeChild(style);
        document.removeEventListener('click', closeMenu);
      }
    };
    
    setTimeout(() => {
      document.addEventListener('click', closeMenu);
    }, 0);

    // Initialize icons in menu
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  handleCompetitorAction(action, competitorName) {
    switch (action) {
      case 'view':
        window.location.href = `competitor.html?name=${encodeURIComponent(competitorName)}`;
        break;
      case 'compare':
        window.location.href = `compare.html?competitors=${encodeURIComponent(competitorName)}`;
        break;
      case 'export':
        this.exportCompetitorData(competitorName);
        break;
      case 'refresh':
        this.refreshCompetitorData(competitorName);
        break;
    }
  }

  async exportCompetitorData(competitorName) {
    try {
      window.loading.show(`Exporting ${competitorName} data...`);
      
      const data = await window.supabaseClient.getCompetitorDetails(competitorName);
      const filename = `${competitorName}-export-${new Date().toISOString().split('T')[0]}.json`;
      
      ComponentUtils.downloadJSON(data, filename);
      window.toast.success(`${competitorName} data exported successfully`);
    } catch (error) {
      console.error('Export error:', error);
      window.toast.error(`Failed to export ${competitorName} data`);
    } finally {
      window.loading.hide();
    }
  }

  async refreshCompetitorData(competitorName) {
    try {
      // Clear cache for this competitor
      window.supabaseClient.cache.delete(`competitor_${competitorName}`);
      
      // Refresh the display
      if (window.dashboard && typeof window.dashboard.loadCompetitors === 'function') {
        await window.dashboard.loadCompetitors();
      }
      
      window.toast.success(`${competitorName} data refreshed`);
    } catch (error) {
      console.error('Refresh error:', error);
      window.toast.error(`Failed to refresh ${competitorName} data`);
    }
  }

  // Utility methods
  showNotification(message, type = 'info') {
    if (window.toast) {
      window.toast[type](message);
    } else {
      console.log(`[${type.toUpperCase()}] ${message}`);
    }
  }

  showLoading(message) {
    if (window.loading) {
      window.loading.show(message);
    }
  }

  hideLoading() {
    if (window.loading) {
      window.loading.hide();
    }
  }

  // Public API
  getPage() {
    return this.currentPage;
  }

  isReady() {
    return this.isInitialized;
  }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
  window.dashboardApp = new DashboardApp();
});

// Export utilities for global access
window.DashboardUtils = {
  showNotification: (message, type) => window.dashboardApp?.showNotification(message, type),
  showLoading: (message) => window.dashboardApp?.showLoading(message),
  hideLoading: () => window.dashboardApp?.hideLoading(),
  trackEvent: (type, action, data) => window.dashboardApp?.trackEvent(type, action, data)
};
