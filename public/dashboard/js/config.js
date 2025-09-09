// Configuration for the Competitive Intelligence Dashboard

// Supabase Configuration
// Note: These should match your Next.js environment variables
const DASHBOARD_CONFIG = {
  supabase: {
    url: 'https://zqvyaxexfbgyvebfnudz.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpxdnlheGV4ZmJneXZlYmZudWR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5MTAyMjIsImV4cCI6MjA3MTQ4NjIyMn0.zpbylqqHT6EF67uEoqvuw7MNAAyBZtSo1mbJ_oEP9yg'
  },
  
  // API Configuration
  api: {
    baseUrl: '/api',
    endpoints: {
      competitors: '/webhook/get-competitors',
      uploadBattlecard: '/webhook/upload-battlecard'
    }
  },
  
  // Dashboard Settings
  dashboard: {
    refreshInterval: 30000, // 30 seconds
    itemsPerPage: 20,
    searchDebounceMs: 300,
    chartColors: {
      primary: '#2563eb',
      secondary: '#64748b',
      success: '#10b981',
      warning: '#f59e0b',
      danger: '#ef4444',
      info: '#06b6d4'
    }
  },
  
  // Data refresh intervals
  intervals: {
    stats: 60000,      // 1 minute
    activity: 30000,   // 30 seconds
    competitors: 120000 // 2 minutes
  }
};

// Export for use in other modules
window.DASHBOARD_CONFIG = DASHBOARD_CONFIG;
