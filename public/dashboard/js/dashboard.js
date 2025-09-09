// Main Dashboard Logic

class Dashboard {
  constructor() {
    this.supabase = window.supabaseClient;
    this.chart = null;
    this.refreshIntervals = [];
    this.filters = {
      vertical: '',
      sourceType: '',
      search: ''
    };
    
    this.init();
  }

  async init() {
    console.log('🚀 Initializing Dashboard...');
    
    // Wait for Supabase to be ready
    await this.waitForSupabase();
    
    // Initialize components
    this.initializeEventListeners();
    this.initializeSearch();
    this.setupRefreshIntervals();
    
    // Load initial data
    await this.loadDashboardData();
    
    // Hide loading overlay
    this.hideLoadingOverlay();
    
    console.log('✅ Dashboard initialized');
  }

  async waitForSupabase() {
    let attempts = 0;
    while (!this.supabase.isConnected && attempts < 10) {
      await new Promise(resolve => setTimeout(resolve, 500));
      attempts++;
    }
    
    if (!this.supabase.isConnected) {
      console.warn('⚠️ Supabase connection timeout - using mock data');
      this.showConnectionWarning();
    }
  }

  initializeEventListeners() {
    // Sidebar toggle
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebarClose = document.getElementById('sidebar-close');
    const mobileOverlay = document.getElementById('mobile-overlay');
    const sidebar = document.getElementById('sidebar');

    if (sidebarToggle) {
      sidebarToggle.addEventListener('click', () => {
        sidebar.classList.add('active');
        mobileOverlay.classList.add('active');
      });
    }

    if (sidebarClose) {
      sidebarClose.addEventListener('click', () => {
        sidebar.classList.remove('active');
        mobileOverlay.classList.remove('active');
      });
    }

    if (mobileOverlay) {
      mobileOverlay.addEventListener('click', () => {
        sidebar.classList.remove('active');
        mobileOverlay.classList.remove('active');
      });
    }

    // Filter controls
    const verticalFilter = document.getElementById('vertical-filter');
    const sourceFilter = document.getElementById('source-filter');
    const clearFilters = document.getElementById('clear-filters');

    if (verticalFilter) {
      verticalFilter.addEventListener('change', (e) => {
        this.filters.vertical = e.target.value;
        this.applyFilters();
      });
    }

    if (sourceFilter) {
      sourceFilter.addEventListener('change', (e) => {
        this.filters.sourceType = e.target.value;
        this.applyFilters();
      });
    }

    if (clearFilters) {
      clearFilters.addEventListener('click', () => {
        this.clearFilters();
      });
    }

    // Header actions
    const refreshData = document.getElementById('refresh-data');
    const addCompetitor = document.getElementById('add-competitor');

    if (refreshData) {
      refreshData.addEventListener('click', () => {
        this.refreshDashboard();
      });
    }

    if (addCompetitor) {
      addCompetitor.addEventListener('click', () => {
        window.location.href = '../'; // Go to main app for battlecard upload
      });
    }

    // Chart period selector
    const chartPeriod = document.getElementById('chart-period');
    if (chartPeriod) {
      chartPeriod.addEventListener('change', (e) => {
        this.updateChart(parseInt(e.target.value));
      });
    }
  }

  initializeSearch() {
    const searchInput = document.getElementById('global-search');
    const searchResults = document.getElementById('search-results');
    let searchTimeout;

    if (searchInput && searchResults) {
      searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        const query = e.target.value.trim();

        if (query.length < 2) {
          searchResults.style.display = 'none';
          return;
        }

        searchTimeout = setTimeout(async () => {
          await this.performSearch(query);
        }, window.DASHBOARD_CONFIG.dashboard.searchDebounceMs);
      });

      // Hide search results when clicking outside
      document.addEventListener('click', (e) => {
        if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
          searchResults.style.display = 'none';
        }
      });
    }
  }

  setupRefreshIntervals() {
    const config = window.DASHBOARD_CONFIG.intervals;

    // Refresh stats
    this.refreshIntervals.push(
      setInterval(() => this.loadStats(), config.stats)
    );

    // Refresh activity
    this.refreshIntervals.push(
      setInterval(() => this.loadRecentActivity(), config.activity)
    );

    // Refresh competitors
    this.refreshIntervals.push(
      setInterval(() => this.loadCompetitors(), config.competitors)
    );
  }

  async loadDashboardData() {
    console.log('📊 Loading dashboard data...');
    
    try {
      await Promise.all([
        this.loadStats(),
        this.loadCompetitors(),
        this.loadRecentActivity(),
        this.loadChart(),
        this.loadVerticals(),
        this.loadFilterOptions()
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      this.showErrorMessage('Failed to load dashboard data');
    }
  }

  async loadStats() {
    try {
      const stats = await this.supabase.getDashboardStats();
      
      // Update stat cards
      document.getElementById('total-competitors').textContent = stats.totalCompetitors;
      document.getElementById('total-documents').textContent = stats.totalDocuments;
      document.getElementById('active-verticals').textContent = stats.activeVerticals;
      
      // Format last updated
      const lastUpdatedElement = document.getElementById('last-updated');
      if (stats.lastUpdated) {
        const date = new Date(stats.lastUpdated);
        lastUpdatedElement.textContent = this.formatRelativeTime(date);
      } else {
        lastUpdatedElement.textContent = 'No data';
      }
      
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }

  async loadCompetitors() {
    const competitorsGrid = document.getElementById('competitors-grid');
    if (!competitorsGrid) return;

    try {
      // Show loading state
      competitorsGrid.innerHTML = `
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Loading competitors...</p>
        </div>
      `;

      const competitors = await this.supabase.getCompetitors(this.filters);
      
      if (competitors.length === 0) {
        competitorsGrid.innerHTML = `
          <div class="loading-state">
            <p>No competitors found</p>
            <button class="btn btn-primary" onclick="window.location.href='../'">
              <i data-lucide="plus"></i>
              Upload First Battlecard
            </button>
          </div>
        `;
        return;
      }

      // Render competitor cards
      competitorsGrid.innerHTML = competitors.map(competitor => 
        this.renderCompetitorCard(competitor)
      ).join('');

      // Re-initialize Lucide icons
      if (window.lucide) {
        window.lucide.createIcons();
      }

    } catch (error) {
      console.error('Error loading competitors:', error);
      competitorsGrid.innerHTML = `
        <div class="loading-state">
          <p>Error loading competitors</p>
          <button class="btn btn-secondary" onclick="dashboard.loadCompetitors()">
            <i data-lucide="refresh-cw"></i>
            Retry
          </button>
        </div>
      `;
    }
  }

  renderCompetitorCard(competitor) {
    const verticalTags = competitor.verticals.slice(0, 3).map(vertical => 
      `<span class="vertical-tag">${vertical}</span>`
    ).join('');

    const moreVerticals = competitor.verticals.length > 3 
      ? `<span class="vertical-tag">+${competitor.verticals.length - 3} more</span>` 
      : '';

    return `
      <div class="competitor-card" onclick="window.location.href='competitor.html?name=${encodeURIComponent(competitor.name)}'">
        <div class="competitor-header">
          <h3 class="competitor-name">${competitor.name}</h3>
          <span class="competitor-status status-${competitor.status}">${competitor.status}</span>
        </div>
        
        <div class="competitor-meta">
          <span><i data-lucide="file-text"></i> ${competitor.totalSources} sources</span>
          <span><i data-lucide="clock"></i> ${this.formatRelativeTime(new Date(competitor.lastUpdated))}</span>
        </div>
        
        <div class="competitor-verticals">
          ${verticalTags}
          ${moreVerticals}
        </div>
        
        <div class="competitor-stats">
          <div class="stat-item">
            <div class="stat-item-value">${competitor.sourceTypes.length}</div>
            <div class="stat-item-label">Source Types</div>
          </div>
          <div class="stat-item">
            <div class="stat-item-value">${competitor.verticals.length}</div>
            <div class="stat-item-label">Verticals</div>
          </div>
          <div class="stat-item">
            <div class="stat-item-value">${competitor.totalSources}</div>
            <div class="stat-item-label">Documents</div>
          </div>
        </div>
      </div>
    `;
  }

  async loadRecentActivity() {
    const activityFeed = document.getElementById('recent-activity');
    if (!activityFeed) return;

    try {
      const activities = await this.supabase.getRecentActivity(10);
      
      if (activities.length === 0) {
        activityFeed.innerHTML = `
          <div class="loading-state">
            <p>No recent activity</p>
          </div>
        `;
        return;
      }

      activityFeed.innerHTML = activities.map(activity => `
        <div class="activity-item">
          <div class="activity-icon">
            <i data-lucide="file-text"></i>
          </div>
          <div class="activity-content">
            <div class="activity-text">
              <strong>${activity.competitor}</strong> - ${activity.title}
            </div>
            <div class="activity-meta">
              ${this.formatRelativeTime(new Date(activity.timestamp))} • ${activity.sourceType}
            </div>
          </div>
        </div>
      `).join('');

      // Re-initialize Lucide icons
      if (window.lucide) {
        window.lucide.createIcons();
      }

    } catch (error) {
      console.error('Error loading recent activity:', error);
    }
  }

  async loadChart(days = 30) {
    const canvas = document.getElementById('content-chart');
    if (!canvas) return;

    try {
      const chartData = await this.supabase.getContentDistribution(days);
      
      // Destroy existing chart
      if (this.chart) {
        this.chart.destroy();
      }

      // Create new chart
      this.chart = new Chart(canvas, {
        type: 'doughnut',
        data: chartData,
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                padding: 20,
                usePointStyle: true
              }
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  const label = context.label || '';
                  const value = context.parsed;
                  const total = context.dataset.data.reduce((a, b) => a + b, 0);
                  const percentage = ((value / total) * 100).toFixed(1);
                  return `${label}: ${value} (${percentage}%)`;
                }
              }
            }
          }
        }
      });

    } catch (error) {
      console.error('Error loading chart:', error);
    }
  }

  async loadVerticals() {
    const verticalsList = document.getElementById('verticals-list');
    if (!verticalsList) return;

    try {
      const verticals = await this.supabase.getTopVerticals(8);
      
      if (verticals.length === 0) {
        verticalsList.innerHTML = `
          <div class="loading-state">
            <p>No verticals data</p>
          </div>
        `;
        return;
      }

      verticalsList.innerHTML = verticals.map(vertical => `
        <div class="vertical-item">
          <span class="vertical-name">${vertical.name}</span>
          <span class="vertical-count">${vertical.count}</span>
        </div>
      `).join('');

    } catch (error) {
      console.error('Error loading verticals:', error);
    }
  }

  async loadFilterOptions() {
    try {
      const verticals = await this.supabase.getTopVerticals(50);
      const verticalFilter = document.getElementById('vertical-filter');
      
      if (verticalFilter && verticals.length > 0) {
        const options = verticals.map(v => 
          `<option value="${v.name}">${v.name} (${v.count})</option>`
        ).join('');
        
        verticalFilter.innerHTML = `
          <option value="">All Verticals</option>
          ${options}
        `;
      }
    } catch (error) {
      console.error('Error loading filter options:', error);
    }
  }

  async performSearch(query) {
    const searchResults = document.getElementById('search-results');
    if (!searchResults) return;

    try {
      const results = await this.supabase.search(query, this.filters);
      
      if (results.length === 0) {
        searchResults.innerHTML = `
          <div style="padding: 1rem; text-align: center; color: var(--text-secondary);">
            No results found for "${query}"
          </div>
        `;
      } else {
        searchResults.innerHTML = results.map(result => `
          <a href="${result.url}" class="search-result-item" style="
            display: block;
            padding: 0.75rem 1rem;
            text-decoration: none;
            color: var(--text-primary);
            border-bottom: 1px solid var(--border);
            transition: background-color 150ms;
          ">
            <div style="font-weight: 500; margin-bottom: 0.25rem;">${result.title}</div>
            <div style="font-size: 0.875rem; color: var(--text-secondary);">
              ${result.competitor} • ${result.sourceType}
            </div>
          </a>
        `).join('');
      }
      
      searchResults.style.display = 'block';

    } catch (error) {
      console.error('Error performing search:', error);
      searchResults.innerHTML = `
        <div style="padding: 1rem; text-align: center; color: var(--danger);">
          Search failed. Please try again.
        </div>
      `;
      searchResults.style.display = 'block';
    }
  }

  async applyFilters() {
    console.log('🔍 Applying filters:', this.filters);
    await this.loadCompetitors();
  }

  clearFilters() {
    this.filters = {
      vertical: '',
      sourceType: '',
      search: ''
    };
    
    // Reset UI
    const verticalFilter = document.getElementById('vertical-filter');
    const sourceFilter = document.getElementById('source-filter');
    const searchInput = document.getElementById('global-search');
    
    if (verticalFilter) verticalFilter.value = '';
    if (sourceFilter) sourceFilter.value = '';
    if (searchInput) searchInput.value = '';
    
    this.applyFilters();
  }

  async updateChart(days) {
    await this.loadChart(days);
  }

  async refreshDashboard() {
    console.log('🔄 Refreshing dashboard...');
    
    // Clear cache
    this.supabase.clearCache();
    
    // Show refresh indicator
    const refreshButton = document.getElementById('refresh-data');
    if (refreshButton) {
      const icon = refreshButton.querySelector('i');
      if (icon) {
        icon.style.animation = 'spin 1s linear infinite';
      }
    }
    
    // Reload data
    await this.loadDashboardData();
    
    // Hide refresh indicator
    if (refreshButton) {
      const icon = refreshButton.querySelector('i');
      if (icon) {
        icon.style.animation = '';
      }
    }
    
    console.log('✅ Dashboard refreshed');
  }

  hideLoadingOverlay() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
      overlay.style.opacity = '0';
      setTimeout(() => {
        overlay.style.display = 'none';
      }, 300);
    }
  }

  showConnectionWarning() {
    const warning = document.createElement('div');
    warning.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: var(--warning);
      color: white;
      padding: 1rem;
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-lg);
      z-index: var(--z-modal);
      max-width: 300px;
    `;
    warning.innerHTML = `
      <strong>⚠️ Connection Warning</strong><br>
      Unable to connect to database. Using demo data.
    `;
    
    document.body.appendChild(warning);
    
    setTimeout(() => {
      warning.remove();
    }, 5000);
  }

  showErrorMessage(message) {
    const error = document.createElement('div');
    error.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: var(--danger);
      color: white;
      padding: 1rem;
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-lg);
      z-index: var(--z-modal);
      max-width: 300px;
    `;
    error.innerHTML = `<strong>❌ Error</strong><br>${message}`;
    
    document.body.appendChild(error);
    
    setTimeout(() => {
      error.remove();
    }, 5000);
  }

  formatRelativeTime(date) {
    const now = new Date();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  }

  destroy() {
    // Clear intervals
    this.refreshIntervals.forEach(interval => clearInterval(interval));
    
    // Destroy chart
    if (this.chart) {
      this.chart.destroy();
    }
  }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.dashboard = new Dashboard();
});
