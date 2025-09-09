// Supabase Client for Dashboard

class SupabaseClient {
  constructor() {
    const config = window.DASHBOARD_CONFIG.supabase;
    this.client = supabase.createClient(config.url, config.anonKey);
    this.isConnected = false;
    this.cache = new Map();
    this.cacheExpiry = new Map();
    this.init();
  }

  async init() {
    try {
      // Test connection
      const { data, error } = await this.client
        .from('kb_sources')
        .select('id')
        .limit(1);
      
      if (error) throw error;
      this.isConnected = true;
      console.log('✅ Supabase connected successfully');
    } catch (error) {
      console.error('❌ Supabase connection failed:', error);
      this.isConnected = false;
    }
  }

  // Cache management
  getCached(key) {
    const expiry = this.cacheExpiry.get(key);
    if (expiry && Date.now() > expiry) {
      this.cache.delete(key);
      this.cacheExpiry.delete(key);
      return null;
    }
    return this.cache.get(key);
  }

  setCache(key, data, ttlMs = 60000) {
    this.cache.set(key, data);
    this.cacheExpiry.set(key, Date.now() + ttlMs);
  }

  clearCache() {
    this.cache.clear();
    this.cacheExpiry.clear();
  }

  // Get dashboard statistics
  async getDashboardStats() {
    const cacheKey = 'dashboard_stats';
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    try {
      // Get total competitors
      const { data: competitorsData, error: competitorsError } = await this.client
        .from('kb_sources')
        .select('competitor')
        .not('competitor', 'is', null);

      if (competitorsError) throw competitorsError;

      const uniqueCompetitors = new Set(
        competitorsData.map(item => item.competitor).filter(Boolean)
      );

      // Get total documents
      const { count: totalDocuments, error: documentsError } = await this.client
        .from('kb_sources')
        .select('*', { count: 'exact', head: true });

      if (documentsError) throw documentsError;

      // Get verticals
      const { data: verticalsData, error: verticalsError } = await this.client
        .from('kb_sources')
        .select('verticals')
        .not('verticals', 'is', null);

      if (verticalsError) throw verticalsError;

      const allVerticals = new Set();
      verticalsData.forEach(item => {
        if (Array.isArray(item.verticals)) {
          item.verticals.forEach(v => allVerticals.add(v));
        }
      });

      // Get last updated
      const { data: lastUpdatedData, error: lastUpdatedError } = await this.client
        .from('kb_sources')
        .select('created_at')
        .order('created_at', { ascending: false })
        .limit(1);

      if (lastUpdatedError) throw lastUpdatedError;

      const stats = {
        totalCompetitors: uniqueCompetitors.size,
        totalDocuments: totalDocuments || 0,
        activeVerticals: allVerticals.size,
        lastUpdated: lastUpdatedData[0]?.created_at || null
      };

      this.setCache(cacheKey, stats, 60000); // Cache for 1 minute
      return stats;

    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return {
        totalCompetitors: 0,
        totalDocuments: 0,
        activeVerticals: 0,
        lastUpdated: null
      };
    }
  }

  // Get competitors with metadata
  async getCompetitors(filters = {}) {
    const cacheKey = `competitors_${JSON.stringify(filters)}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    try {
      let query = this.client
        .from('kb_sources')
        .select('*')
        .not('competitor', 'is', null);

      // Apply filters
      if (filters.vertical) {
        query = query.contains('verticals', [filters.vertical]);
      }
      
      if (filters.sourceType) {
        query = query.eq('source_type', filters.sourceType);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      // Group by competitor
      const competitorMap = new Map();
      
      data.forEach(source => {
        const competitor = source.competitor;
        if (!competitorMap.has(competitor)) {
          competitorMap.set(competitor, {
            name: competitor,
            sources: [],
            verticals: new Set(),
            sourceTypes: new Set(),
            lastUpdated: source.created_at,
            totalSources: 0
          });
        }

        const comp = competitorMap.get(competitor);
        comp.sources.push(source);
        comp.totalSources++;
        
        // Add verticals
        if (Array.isArray(source.verticals)) {
          source.verticals.forEach(v => comp.verticals.add(v));
        }
        
        // Add source types
        if (source.source_type) {
          comp.sourceTypes.add(source.source_type);
        }

        // Update last updated
        if (new Date(source.created_at) > new Date(comp.lastUpdated)) {
          comp.lastUpdated = source.created_at;
        }
      });

      // Convert to array and process
      const competitors = Array.from(competitorMap.values()).map(comp => ({
        ...comp,
        verticals: Array.from(comp.verticals),
        sourceTypes: Array.from(comp.sourceTypes),
        status: comp.totalSources > 5 ? 'active' : 'monitoring'
      }));

      this.setCache(cacheKey, competitors, 120000); // Cache for 2 minutes
      return competitors;

    } catch (error) {
      console.error('Error fetching competitors:', error);
      return [];
    }
  }

  // Get recent activity
  async getRecentActivity(limit = 10) {
    const cacheKey = `recent_activity_${limit}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    try {
      const { data, error } = await this.client
        .from('kb_sources')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      const activities = data.map(source => ({
        id: source.id,
        type: 'upload',
        title: source.title || `${source.source_type} uploaded`,
        competitor: source.competitor,
        sourceType: source.source_type,
        timestamp: source.created_at,
        metadata: source.metadata
      }));

      this.setCache(cacheKey, activities, 30000); // Cache for 30 seconds
      return activities;

    } catch (error) {
      console.error('Error fetching recent activity:', error);
      return [];
    }
  }

  // Get content distribution data for charts
  async getContentDistribution(days = 30) {
    const cacheKey = `content_distribution_${days}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await this.client
        .from('kb_sources')
        .select('source_type, created_at')
        .gte('created_at', startDate.toISOString());

      if (error) throw error;

      // Group by source type
      const distribution = {};
      data.forEach(item => {
        const type = item.source_type || 'unknown';
        distribution[type] = (distribution[type] || 0) + 1;
      });

      // Convert to chart format
      const chartData = {
        labels: Object.keys(distribution),
        datasets: [{
          data: Object.values(distribution),
          backgroundColor: [
            window.DASHBOARD_CONFIG.dashboard.chartColors.primary,
            window.DASHBOARD_CONFIG.dashboard.chartColors.success,
            window.DASHBOARD_CONFIG.dashboard.chartColors.warning,
            window.DASHBOARD_CONFIG.dashboard.chartColors.info,
            window.DASHBOARD_CONFIG.dashboard.chartColors.secondary
          ]
        }]
      };

      this.setCache(cacheKey, chartData, 300000); // Cache for 5 minutes
      return chartData;

    } catch (error) {
      console.error('Error fetching content distribution:', error);
      return {
        labels: [],
        datasets: [{ data: [], backgroundColor: [] }]
      };
    }
  }

  // Get top verticals
  async getTopVerticals(limit = 10) {
    const cacheKey = `top_verticals_${limit}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    try {
      const { data, error } = await this.client
        .from('kb_sources')
        .select('verticals')
        .not('verticals', 'is', null);

      if (error) throw error;

      // Count verticals
      const verticalCount = {};
      data.forEach(item => {
        if (Array.isArray(item.verticals)) {
          item.verticals.forEach(vertical => {
            verticalCount[vertical] = (verticalCount[vertical] || 0) + 1;
          });
        }
      });

      // Sort and limit
      const topVerticals = Object.entries(verticalCount)
        .sort(([,a], [,b]) => b - a)
        .slice(0, limit)
        .map(([name, count]) => ({ name, count }));

      this.setCache(cacheKey, topVerticals, 300000); // Cache for 5 minutes
      return topVerticals;

    } catch (error) {
      console.error('Error fetching top verticals:', error);
      return [];
    }
  }

  // Search functionality
  async search(query, filters = {}) {
    if (!query || query.length < 2) return [];

    try {
      let supabaseQuery = this.client
        .from('kb_sources')
        .select('*')
        .or(`competitor.ilike.%${query}%,title.ilike.%${query}%`);

      // Apply filters
      if (filters.vertical) {
        supabaseQuery = supabaseQuery.contains('verticals', [filters.vertical]);
      }
      
      if (filters.sourceType) {
        supabaseQuery = supabaseQuery.eq('source_type', filters.sourceType);
      }

      const { data, error } = await supabaseQuery
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      return data.map(item => ({
        id: item.id,
        type: 'source',
        title: item.title || `${item.competitor} - ${item.source_type}`,
        competitor: item.competitor,
        sourceType: item.source_type,
        verticals: item.verticals,
        url: `competitor.html?id=${item.competitor}`
      }));

    } catch (error) {
      console.error('Error searching:', error);
      return [];
    }
  }

  // Get competitor details
  async getCompetitorDetails(competitorName) {
    const cacheKey = `competitor_${competitorName}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    try {
      const { data, error } = await this.client
        .from('kb_sources')
        .select('*')
        .eq('competitor', competitorName)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get related chunks
      const { data: chunks, error: chunksError } = await this.client
        .from('kb_chunks')
        .select('*')
        .contains('metadata', { competitor: competitorName })
        .limit(50);

      if (chunksError) {
        console.warn('Error fetching chunks:', chunksError);
      }

      const details = {
        name: competitorName,
        sources: data,
        chunks: chunks || [],
        totalSources: data.length,
        totalChunks: chunks?.length || 0,
        verticals: [...new Set(data.flatMap(s => s.verticals || []))],
        sourceTypes: [...new Set(data.map(s => s.source_type).filter(Boolean))],
        lastUpdated: data[0]?.created_at || null
      };

      this.setCache(cacheKey, details, 300000); // Cache for 5 minutes
      return details;

    } catch (error) {
      console.error('Error fetching competitor details:', error);
      return null;
    }
  }
}

// Initialize global instance
window.supabaseClient = new SupabaseClient();
