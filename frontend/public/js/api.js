// API Helper Functions
const API_BASE = '/api';

class API {
  constructor() {
    this.token = localStorage.getItem('utm_token');
  }

  async request(endpoint, options = {}) {
    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    if (this.token) {
      config.headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, config);
      
      if (response.status === 401) {
        // Unauthorized - redirect to login
        localStorage.removeItem('utm_token');
        window.location.href = '/';
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'API request failed');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Auth methods
  async login(email, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    if (data.token) {
      this.token = data.token;
      localStorage.setItem('utm_token', data.token);
      localStorage.setItem('utm_user', JSON.stringify(data.user));
    }
    
    return data;
  }

  async register(userData) {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    
    if (data.token) {
      this.token = data.token;
      localStorage.setItem('utm_token', data.token);
      localStorage.setItem('utm_user', JSON.stringify(data.user));
    }
    
    return data;
  }

  async logout() {
    localStorage.removeItem('utm_token');
    localStorage.removeItem('utm_user');
    window.location.href = '/';
  }

  async getMe() {
    return this.request('/auth/me');
  }

  // Campaign methods
  async getCampaigns(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/campaigns?${query}`);
  }

  async getCampaign(id) {
    return this.request(`/campaigns/${id}`);
  }

  async createCampaign(data) {
    return this.request('/campaigns', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCampaign(id, data) {
    return this.request(`/campaigns/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteCampaign(id) {
    return this.request(`/campaigns/${id}`, {
      method: 'DELETE',
    });
  }

  async getCampaignPerformance(id) {
    return this.request(`/campaigns/${id}/performance`);
  }

  // UTM methods
  async buildUTM(data) {
    return this.request('/utm/build', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getUTMTemplates() {
    return this.request('/utm/templates');
  }

  async bulkCreateUTM(data) {
    return this.request('/utm/bulk', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getUTMHistory(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/utm/history?${query}`);
  }

  // Analytics methods
  async getDashboard(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/analytics/dashboard?${query}`);
  }
  
  async getSessions(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/analytics/sessions?${query}`);
  }
  
  async getAnalyticsOverview(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/analytics/overview?${query}`);
  }

  async getTrafficSources(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/analytics/sources?${query}`);
  }

  async getPageAnalytics(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/analytics/pages?${query}`);
  }

  async getFunnelAnalysis(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/analytics/funnel?${query}`);
  }

  async getRealtimeAnalytics(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/analytics/realtime?${query}`);
  }

  // Reports methods
  async getCampaignReport(campaignId, params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/reports/campaign/${campaignId}?${query}`);
  }

  async getAttributionReport(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/reports/attribution?${query}`);
  }

  async exportSessions(params = {}) {
    const query = new URLSearchParams(params).toString();
    window.open(`${API_BASE}/reports/export/sessions?${query}`, '_blank');
  }
}

// Global API instance
window.api = new API();