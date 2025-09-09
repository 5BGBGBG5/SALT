// Competitor Profile Page Logic

class CompetitorProfile {
  constructor() {
    this.supabase = window.supabaseClient;
    this.competitorName = null;
    this.competitorData = null;
    this.charts = {};
    this.activeTab = 'overview';
    
    this.init();
  }

  async init() {
    console.log('🚀 Initializing Competitor Profile...');
    
    // Get competitor name from URL
    this.competitorName = this.getCompetitorFromURL();
    if (!this.competitorName) {
      this.showError('No competitor specified');
      return;
    }
    
    // Wait for Supabase to be ready
    await this.waitForSupabase();
    
    // Initialize components
    this.initializeEventListeners();
    this.initializeTabs();
    
    // Load competitor data
    await this.loadCompetitorData();
    
    // Hide loading overlay
    this.hideLoadingOverlay();
    
    console.log('✅ Competitor Profile initialized');
  }

  getCompetitorFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('name') || urlParams.get('id');
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
    // Sidebar toggle (mobile)
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

    // Header actions
    const refreshData = document.getElementById('refresh-data');
    const exportProfile = document.getElementById('export-profile');
    const shareProfile = document.getElementById('share-profile');
    const addBattlecard = document.getElementById('add-battlecard');
    const compareCompetitor = document.getElementById('compare-competitor');

    if (refreshData) {
      refreshData.addEventListener('click', () => this.refreshData());
    }

    if (exportProfile) {
      exportProfile.addEventListener('click', () => this.exportProfile());
    }

    if (shareProfile) {
      shareProfile.addEventListener('click', () => this.shareProfile());
    }

    if (addBattlecard) {
      addBattlecard.addEventListener('click', () => {
        window.location.href = '../';
      });
    }

    if (compareCompetitor) {
      compareCompetitor.addEventListener('click', () => {
        window.location.href = `compare.html?competitors=${encodeURIComponent(this.competitorName)}`;
      });
    }

    // Source type filter
    const sourceTypeFilter = document.getElementById('source-type-filter');
    if (sourceTypeFilter) {
      sourceTypeFilter.addEventListener('change', (e) => {
        this.filterSources(e.target.value);
      });
    }

    // Comparison actions
    const startComparison = document.getElementById('start-comparison');
    if (startComparison) {
      startComparison.addEventListener('click', () => this.startComparison());
    }
  }

  initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const tabId = e.target.getAttribute('data-tab');
        this.switchTab(tabId);
      });
    });
  }

  switchTab(tabId) {
    // Update active tab
    this.activeTab = tabId;

    // Update button states
    document.querySelectorAll('.tab-button').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');

    // Update content visibility
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });
    document.getElementById(`${tabId}-tab`).classList.add('active');

    // Load tab-specific data
    this.loadTabData(tabId);
  }

  async loadCompetitorData() {
    if (!this.competitorName) return;

    try {
      console.log(`📊 Loading data for ${this.competitorName}...`);
      
      this.competitorData = await this.supabase.getCompetitorDetails(this.competitorName);
      
      if (!this.competitorData) {
        this.showError(`Competitor "${this.competitorName}" not found`);
        return;
      }

      // Update page title and breadcrumb
      document.title = `${this.competitorName} - Competitor Profile`;
      document.getElementById('competitor-breadcrumb').textContent = this.competitorName;
      
      // Update hero section
      this.updateHeroSection();
      
      // Load initial tab data
      await this.loadTabData(this.activeTab);

    } catch (error) {
      console.error('Error loading competitor data:', error);
      this.showError('Failed to load competitor data');
    }
  }

  updateHeroSection() {
    if (!this.competitorData) return;

    const data = this.competitorData;
    
    document.getElementById('competitor-name').textContent = data.name;
    document.getElementById('competitor-sources').innerHTML = 
      `<i data-lucide="file-text"></i> ${data.totalSources} sources`;
    document.getElementById('competitor-verticals').innerHTML = 
      `<i data-lucide="tag"></i> ${data.verticals.length} verticals`;
    
    if (data.lastUpdated) {
      const lastUpdated = this.formatRelativeTime(new Date(data.lastUpdated));
      document.getElementById('competitor-updated').innerHTML = 
        `<i data-lucide="clock"></i> Last updated ${lastUpdated}`;
    }

    // Re-initialize Lucide icons
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  async loadTabData(tabId) {
    if (!this.competitorData) return;

    switch (tabId) {
      case 'overview':
        await this.loadOverviewTab();
        break;
      case 'battlecards':
        await this.loadBattlecardsTab();
        break;
      case 'insights':
        await this.loadInsightsTab();
        break;
      case 'timeline':
        await this.loadTimelineTab();
        break;
      case 'comparison':
        await this.loadComparisonTab();
        break;
    }
  }

  async loadOverviewTab() {
    // Load key metrics
    this.loadKeyMetrics();
    
    // Load vertical distribution chart
    await this.loadVerticalChart();
    
    // Load recent sources
    this.loadRecentSources();
  }

  loadKeyMetrics() {
    const data = this.competitorData;
    const metricsContainer = document.getElementById('key-metrics');
    
    const metrics = [
      { label: 'Total Sources', value: data.totalSources },
      { label: 'Content Chunks', value: data.totalChunks },
      { label: 'Verticals', value: data.verticals.length },
      { label: 'Source Types', value: data.sourceTypes.length }
    ];

    metricsContainer.innerHTML = metrics.map(metric => `
      <div class="metric-item">
        <div class="metric-value">${metric.value}</div>
        <div class="metric-label">${metric.label}</div>
      </div>
    `).join('');
  }

  async loadVerticalChart() {
    const canvas = document.getElementById('vertical-chart');
    if (!canvas) return;

    const data = this.competitorData;
    
    // Count sources by vertical
    const verticalCounts = {};
    data.sources.forEach(source => {
      if (Array.isArray(source.verticals)) {
        source.verticals.forEach(vertical => {
          verticalCounts[vertical] = (verticalCounts[vertical] || 0) + 1;
        });
      }
    });

    const chartData = {
      labels: Object.keys(verticalCounts),
      datasets: [{
        data: Object.values(verticalCounts),
        backgroundColor: [
          window.DASHBOARD_CONFIG.dashboard.chartColors.primary,
          window.DASHBOARD_CONFIG.dashboard.chartColors.success,
          window.DASHBOARD_CONFIG.dashboard.chartColors.warning,
          window.DASHBOARD_CONFIG.dashboard.chartColors.info,
          window.DASHBOARD_CONFIG.dashboard.chartColors.secondary
        ]
      }]
    };

    // Destroy existing chart
    if (this.charts.vertical) {
      this.charts.vertical.destroy();
    }

    // Create new chart
    this.charts.vertical = new Chart(canvas, {
      type: 'doughnut',
      data: chartData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 10,
              usePointStyle: true,
              font: { size: 12 }
            }
          }
        }
      }
    });
  }

  loadRecentSources() {
    const data = this.competitorData;
    const container = document.getElementById('recent-sources');
    
    const recentSources = data.sources
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5);

    if (recentSources.length === 0) {
      container.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No sources available</p>';
      return;
    }

    container.innerHTML = recentSources.map(source => `
      <div class="source-card" style="margin-bottom: var(--space-sm);">
        <div class="source-header">
          <div class="source-title">${source.title || 'Untitled'}</div>
          <div class="source-type">${source.source_type}</div>
        </div>
        <div class="source-meta">
          ${this.formatRelativeTime(new Date(source.created_at))}
        </div>
        <div class="source-verticals">
          ${(source.verticals || []).map(v => `<span class="vertical-tag">${v}</span>`).join('')}
        </div>
      </div>
    `).join('');
  }

  async loadBattlecardsTab() {
    const container = document.getElementById('sources-grid');
    const data = this.competitorData;

    if (data.sources.length === 0) {
      container.innerHTML = `
        <div class="loading-state">
          <p>No battlecards found for ${data.name}</p>
          <button class="btn btn-primary" onclick="window.location.href='../'">
            <i data-lucide="plus"></i>
            Upload First Battlecard
          </button>
        </div>
      `;
      return;
    }

    container.innerHTML = data.sources.map(source => `
      <div class="source-card">
        <div class="source-header">
          <div class="source-title">${source.title || 'Untitled'}</div>
          <div class="source-type">${source.source_type}</div>
        </div>
        <div class="source-meta">
          <i data-lucide="calendar"></i> ${this.formatDate(new Date(source.created_at))}
          ${source.url ? `<br><i data-lucide="link"></i> <a href="${source.url}" target="_blank">View Source</a>` : ''}
        </div>
        <div class="source-verticals">
          ${(source.verticals || []).map(v => `<span class="vertical-tag">${v}</span>`).join('')}
        </div>
        ${source.metadata ? `
          <div style="margin-top: var(--space-sm); padding-top: var(--space-sm); border-top: 1px solid var(--border); font-size: var(--text-sm); color: var(--text-secondary);">
            ${Object.entries(source.metadata).map(([key, value]) => `<div><strong>${key}:</strong> ${value}</div>`).join('')}
          </div>
        ` : ''}
      </div>
    `).join('');

    // Re-initialize Lucide icons
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  async loadInsightsTab() {
    const container = document.getElementById('insights-container');
    const data = this.competitorData;

    // Generate insights based on available data
    const insights = this.generateInsights(data);

    container.innerHTML = insights.map(insight => `
      <div class="insight-card">
        <div class="insight-header">
          <div class="insight-icon">
            <i data-lucide="${insight.icon}"></i>
          </div>
          <div>
            <h3 style="margin: 0; font-size: var(--text-lg); color: var(--text-primary);">${insight.title}</h3>
            <div style="font-size: var(--text-sm); color: var(--text-secondary);">${insight.category}</div>
          </div>
        </div>
        <div class="insight-content">${insight.content}</div>
      </div>
    `).join('');

    // Re-initialize Lucide icons
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  generateInsights(data) {
    const insights = [];

    // Content volume insight
    insights.push({
      icon: 'trending-up',
      title: 'Content Volume Analysis',
      category: 'Data Intelligence',
      content: `${data.name} has ${data.totalSources} sources across ${data.verticals.length} verticals. This represents ${data.totalSources > 10 ? 'substantial' : data.totalSources > 5 ? 'moderate' : 'limited'} competitive intelligence coverage.`
    });

    // Vertical distribution insight
    if (data.verticals.length > 0) {
      const topVertical = data.verticals[0]; // Simplified - should be based on actual counts
      insights.push({
        icon: 'target',
        title: 'Market Focus',
        category: 'Strategic Analysis',
        content: `Primary focus appears to be in ${topVertical} vertical${data.verticals.length > 1 ? `, with additional presence in ${data.verticals.length - 1} other verticals` : ''}. This suggests ${data.verticals.length > 3 ? 'a diversified' : 'a focused'} market approach.`
      });
    }

    // Source type analysis
    if (data.sourceTypes.length > 0) {
      insights.push({
        icon: 'file-text',
        title: 'Information Sources',
        category: 'Data Quality',
        content: `Intelligence gathered from ${data.sourceTypes.length} different source types: ${data.sourceTypes.join(', ')}. ${data.sourceTypes.includes('battlecard') ? 'Includes formal battlecard documentation.' : 'No formal battlecards detected.'}`
      });
    }

    // Recency insight
    if (data.lastUpdated) {
      const daysSinceUpdate = Math.floor((new Date() - new Date(data.lastUpdated)) / (1000 * 60 * 60 * 24));
      insights.push({
        icon: 'clock',
        title: 'Data Freshness',
        category: 'Data Quality',
        content: `Most recent intelligence update was ${daysSinceUpdate} days ago. ${daysSinceUpdate < 7 ? 'Data is very current.' : daysSinceUpdate < 30 ? 'Data is reasonably current.' : 'Data may need refreshing.'}`
      });
    }

    return insights;
  }

  async loadTimelineTab() {
    const container = document.getElementById('timeline-container');
    const data = this.competitorData;

    // Sort sources by date
    const sortedSources = data.sources.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    if (sortedSources.length === 0) {
      container.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No timeline data available</p>';
      return;
    }

    const timelineHTML = `
      <div class="timeline-line"></div>
      ${sortedSources.map(source => `
        <div class="timeline-item">
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: var(--space-sm);">
            <div>
              <h4 style="margin: 0; font-size: var(--text-base); color: var(--text-primary);">${source.title || 'Content Update'}</h4>
              <div style="font-size: var(--text-sm); color: var(--text-secondary); margin-top: var(--space-xs);">
                ${source.source_type} • ${this.formatDate(new Date(source.created_at))}
              </div>
            </div>
            <div class="source-type">${source.source_type}</div>
          </div>
          <div class="source-verticals">
            ${(source.verticals || []).map(v => `<span class="vertical-tag">${v}</span>`).join('')}
          </div>
        </div>
      `).join('')}
    `;

    container.innerHTML = timelineHTML;
  }

  async loadComparisonTab() {
    const container = document.getElementById('comparison-grid');
    
    try {
      // Get other competitors for comparison
      const allCompetitors = await this.supabase.getCompetitors();
      const otherCompetitors = allCompetitors.filter(c => c.name !== this.competitorName);

      if (otherCompetitors.length === 0) {
        container.innerHTML = `
          <div class="loading-state">
            <p>No other competitors available for comparison</p>
            <button class="btn btn-primary" onclick="window.location.href='../'">
              <i data-lucide="plus"></i>
              Add More Competitors
            </button>
          </div>
        `;
        return;
      }

      container.innerHTML = otherCompetitors.map(competitor => `
        <div class="comparison-card" data-competitor="${competitor.name}">
          <h4 style="margin: 0 0 var(--space-sm) 0; font-size: var(--text-lg);">${competitor.name}</h4>
          <div style="display: flex; justify-content: space-between; margin-bottom: var(--space-sm); font-size: var(--text-sm); color: var(--text-secondary);">
            <span>${competitor.totalSources} sources</span>
            <span>${competitor.verticals.length} verticals</span>
          </div>
          <div style="display: flex; flex-wrap: wrap; gap: var(--space-xs);">
            ${competitor.verticals.slice(0, 3).map(v => `<span class="vertical-tag">${v}</span>`).join('')}
            ${competitor.verticals.length > 3 ? `<span class="vertical-tag">+${competitor.verticals.length - 3}</span>` : ''}
          </div>
        </div>
      `).join('');

      // Add click handlers for comparison cards
      container.querySelectorAll('.comparison-card').forEach(card => {
        card.addEventListener('click', () => {
          card.classList.toggle('selected');
        });
      });

    } catch (error) {
      console.error('Error loading comparison data:', error);
      container.innerHTML = '<p style="text-align: center; color: var(--danger);">Error loading comparison data</p>';
    }
  }

  filterSources(sourceType) {
    const cards = document.querySelectorAll('#sources-grid .source-card');
    
    cards.forEach(card => {
      const cardSourceType = card.querySelector('.source-type').textContent.toLowerCase();
      
      if (!sourceType || cardSourceType === sourceType.toLowerCase()) {
        card.style.display = 'block';
      } else {
        card.style.display = 'none';
      }
    });
  }

  startComparison() {
    const selectedCards = document.querySelectorAll('.comparison-card.selected');
    
    if (selectedCards.length === 0) {
      alert('Please select at least one competitor to compare with.');
      return;
    }

    const selectedCompetitors = Array.from(selectedCards).map(card => 
      card.getAttribute('data-competitor')
    );

    const competitors = [this.competitorName, ...selectedCompetitors];
    const compareUrl = `compare.html?competitors=${competitors.map(c => encodeURIComponent(c)).join(',')}`;
    
    window.location.href = compareUrl;
  }

  async refreshData() {
    console.log('🔄 Refreshing competitor data...');
    
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
    await this.loadCompetitorData();
    
    // Hide refresh indicator
    if (refreshButton) {
      const icon = refreshButton.querySelector('i');
      if (icon) {
        icon.style.animation = '';
      }
    }
    
    console.log('✅ Competitor data refreshed');
  }

  exportProfile() {
    if (!this.competitorData) return;

    const data = {
      competitor: this.competitorData.name,
      summary: {
        totalSources: this.competitorData.totalSources,
        totalChunks: this.competitorData.totalChunks,
        verticals: this.competitorData.verticals,
        sourceTypes: this.competitorData.sourceTypes,
        lastUpdated: this.competitorData.lastUpdated
      },
      sources: this.competitorData.sources,
      exportedAt: new Date().toISOString(),
      exportedBy: 'SALT Platform'
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${this.competitorData.name}-profile-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log('📄 Profile exported');
  }

  shareProfile() {
    const url = window.location.href;
    
    if (navigator.share) {
      navigator.share({
        title: `${this.competitorName} - Competitor Profile`,
        text: `View competitive intelligence for ${this.competitorName}`,
        url: url
      });
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(url).then(() => {
        alert('Profile URL copied to clipboard!');
      }).catch(() => {
        prompt('Copy this URL to share:', url);
      });
    }
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

  showError(message) {
    const main = document.querySelector('.main-content');
    main.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 60vh; text-align: center;">
        <div style="font-size: var(--text-4xl); margin-bottom: var(--space-md); color: var(--danger);">⚠️</div>
        <h1 style="font-size: var(--text-2xl); margin-bottom: var(--space-sm); color: var(--text-primary);">Error</h1>
        <p style="color: var(--text-secondary); margin-bottom: var(--space-lg);">${message}</p>
        <div style="display: flex; gap: var(--space-sm);">
          <button class="btn btn-primary" onclick="window.location.href='index.html'">
            <i data-lucide="home"></i>
            Back to Dashboard
          </button>
          <button class="btn btn-secondary" onclick="window.location.reload()">
            <i data-lucide="refresh-cw"></i>
            Retry
          </button>
        </div>
      </div>
    `;
    
    if (window.lucide) {
      window.lucide.createIcons();
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

  formatDate(date) {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  destroy() {
    // Destroy charts
    Object.values(this.charts).forEach(chart => {
      if (chart && chart.destroy) {
        chart.destroy();
      }
    });
  }
}

// Initialize competitor profile when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.competitorProfile = new CompetitorProfile();
});
