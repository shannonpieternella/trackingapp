// Jarvis AI Assistant for UTM Tracking Platform
class JarvisAI {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.messages = [];
    this.context = {
      filters: {},
      currentView: 'dashboard',
      userData: {}
    };
    this.isOpen = false;
    this.isTyping = false;
    this.init();
  }

  init() {
    this.createUI();
    this.bindEvents();
    this.loadChatHistory();
    this.updateContext();
    this.showWelcomeMessage();
  }

  createUI() {
    // Create chat bubble
    const bubble = document.createElement('div');
    bubble.className = 'jarvis-bubble';
    bubble.id = 'jarvisBubble';
    bubble.innerHTML = `
      <svg class="jarvis-bubble-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path>
      </svg>
      <div class="jarvis-bubble-pulse"></div>
    `;
    document.body.appendChild(bubble);

    // Create chat container
    const container = document.createElement('div');
    container.className = 'jarvis-container';
    container.id = 'jarvisContainer';
    container.innerHTML = `
      <div class="jarvis-header">
        <div class="jarvis-header-content">
          <div class="jarvis-avatar">🤖</div>
          <div class="jarvis-header-text">
            <h3>Jarvis AI Assistant</h3>
            <p>Your data analysis companion</p>
          </div>
        </div>
        <div class="jarvis-header-actions">
          <button class="jarvis-header-btn" id="jarvisFullscreen" title="Fullscreen">
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"></path>
            </svg>
          </button>
          <button class="jarvis-header-btn" id="jarvisMinimize" title="Minimize">
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
      </div>

      <div class="jarvis-quick-actions" id="jarvisQuickActions">
        <button class="jarvis-quick-action" data-question="What's my conversion rate today?">📊 Today's conversion</button>
        <button class="jarvis-quick-action" data-question="Show me top traffic sources">🌐 Top sources</button>
        <button class="jarvis-quick-action" data-question="Analyze user journey patterns">🛤️ User journeys</button>
        <button class="jarvis-quick-action" data-question="Find anomalies in data">⚠️ Anomalies</button>
        <button class="jarvis-quick-action" data-question="Predict next week's traffic">🔮 Predictions</button>
      </div>

      <div class="jarvis-messages" id="jarvisMessages"></div>

      <div class="jarvis-input-container">
        <div class="jarvis-input-wrapper">
          <textarea 
            class="jarvis-input-field" 
            id="jarvisInput" 
            placeholder="Ask me anything about your data..."
            rows="1"
          ></textarea>
          <div class="jarvis-input-actions">
            <button class="jarvis-input-btn jarvis-voice-btn" id="jarvisVoice" title="Voice input">
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"></path>
              </svg>
            </button>
            <button class="jarvis-input-btn" id="jarvisSend" title="Send">
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(container);
  }

  bindEvents() {
    // Toggle chat
    document.getElementById('jarvisBubble').addEventListener('click', () => this.toggle());
    document.getElementById('jarvisMinimize').addEventListener('click', () => this.close());
    
    // Fullscreen
    document.getElementById('jarvisFullscreen').addEventListener('click', () => {
      document.getElementById('jarvisContainer').classList.toggle('fullscreen');
    });

    // Send message
    document.getElementById('jarvisSend').addEventListener('click', () => this.sendMessage());
    document.getElementById('jarvisInput').addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    // Auto-resize textarea
    document.getElementById('jarvisInput').addEventListener('input', (e) => {
      e.target.style.height = 'auto';
      e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
    });

    // Quick actions
    document.querySelectorAll('.jarvis-quick-action').forEach(btn => {
      btn.addEventListener('click', () => {
        document.getElementById('jarvisInput').value = btn.dataset.question;
        this.sendMessage();
      });
    });

    // Voice input
    document.getElementById('jarvisVoice').addEventListener('click', () => this.toggleVoiceInput());
  }

  toggle() {
    this.isOpen = !this.isOpen;
    const bubble = document.getElementById('jarvisBubble');
    const container = document.getElementById('jarvisContainer');
    
    bubble.classList.toggle('active', this.isOpen);
    container.classList.toggle('active', this.isOpen);

    if (this.isOpen) {
      document.getElementById('jarvisInput').focus();
      this.updateContext();
    }
  }

  close() {
    this.isOpen = false;
    document.getElementById('jarvisBubble').classList.remove('active');
    document.getElementById('jarvisContainer').classList.remove('active');
  }

  async sendMessage() {
    const input = document.getElementById('jarvisInput');
    const message = input.value.trim();
    
    if (!message) return;

    // Add user message
    this.addMessage('user', message);
    
    // Clear input
    input.value = '';
    input.style.height = 'auto';

    // Show typing indicator
    this.showTyping();

    try {
      // Get current data context
      const context = await this.gatherDataContext();
      
      // Send to OpenAI
      const response = await this.callOpenAI(message, context);
      
      // Add AI response
      this.hideTyping();
      this.addMessage('ai', response);

    } catch (error) {
      this.hideTyping();
      this.addMessage('ai', '❌ Sorry, I encountered an error. Please try again.');
      console.error('Jarvis AI Error:', error);
    }
  }

  async gatherDataContext() {
    const context = {
      currentFilters: this.context.filters,
      currentView: this.context.currentView,
      timestamp: new Date().toISOString()
    };

    try {
      // Get current dashboard data based on filters
      const params = {
        ...this.context.filters,
        startDate: this.context.filters.startDate || this.getDefaultStartDate(),
        endDate: this.context.filters.endDate || new Date().toISOString()
      };

      // Fetch relevant data
      const [analytics, campaigns, sources] = await Promise.all([
        api.getAnalytics(params),
        api.getCampaigns({ ...params, limit: 10 }),
        api.getTrafficSources({ ...params, limit: 10 })
      ]);

      context.analytics = analytics;
      context.campaigns = campaigns;
      context.trafficSources = sources;

      // Get user journey data if requested
      if (this.context.currentView === 'journey') {
        context.journeyData = await api.getFunnelAnalysis(params);
      }

    } catch (error) {
      console.error('Error gathering context:', error);
    }

    return context;
  }

  async callOpenAI(message, context) {
    const systemPrompt = `You are Jarvis, an AI assistant for a UTM tracking analytics platform. 
    You have access to real-time data about website traffic, campaigns, conversions, and user behavior.
    
    Current context:
    - View: ${context.currentView}
    - Filters: ${JSON.stringify(context.currentFilters)}
    - Analytics data: ${JSON.stringify(context.analytics)}
    
    Provide insightful, actionable responses. Use emojis appropriately. Format numbers nicely.
    When showing data, use the data card format. Be concise but helpful.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          ...this.messages.map(m => ({
            role: m.sender === 'user' ? 'user' : 'assistant',
            content: m.content
          })),
          { role: 'user', content: message }
        ],
        functions: [
          {
            name: 'show_data_card',
            description: 'Display data in a formatted card',
            parameters: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                metrics: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      label: { type: 'string' },
                      value: { type: 'string' },
                      change: { type: 'number' },
                      changeType: { type: 'string', enum: ['positive', 'negative', 'neutral'] }
                    }
                  }
                }
              }
            }
          },
          {
            name: 'show_chart',
            description: 'Display a chart visualization',
            parameters: {
              type: 'object',
              properties: {
                type: { type: 'string', enum: ['line', 'bar', 'pie', 'donut'] },
                data: { type: 'object' },
                title: { type: 'string' }
              }
            }
          }
        ],
        function_call: 'auto',
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    const data = await response.json();
    
    if (data.choices[0].message.function_call) {
      // Handle function calls for rich content
      return this.handleFunctionCall(
        data.choices[0].message.function_call,
        data.choices[0].message.content
      );
    }

    return data.choices[0].message.content;
  }

  handleFunctionCall(functionCall, textContent) {
    const { name, arguments: args } = functionCall;
    const params = JSON.parse(args);

    let content = textContent || '';

    if (name === 'show_data_card') {
      content += this.renderDataCard(params);
    } else if (name === 'show_chart') {
      content += this.renderChart(params);
    }

    return content;
  }

  renderDataCard(params) {
    const metricsHtml = params.metrics.map(metric => `
      <div class="jarvis-data-metric">
        <div>
          <div class="jarvis-data-label">${metric.label}</div>
          ${metric.change ? `
            <div class="jarvis-data-change ${metric.changeType}">
              ${metric.changeType === 'positive' ? '↑' : '↓'} ${Math.abs(metric.change)}%
            </div>
          ` : ''}
        </div>
        <div class="jarvis-data-value">${metric.value}</div>
      </div>
    `).join('');

    return `
      <div class="jarvis-data-card">
        <div class="jarvis-data-card-title">${params.title}</div>
        ${metricsHtml}
      </div>
    `;
  }

  renderChart(params) {
    const chartId = `jarvis-chart-${Date.now()}`;
    
    setTimeout(() => {
      const chartElement = document.getElementById(chartId);
      if (chartElement && window.Chart) {
        new Chart(chartElement, {
          type: params.type,
          data: params.data,
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: params.type === 'pie' || params.type === 'donut'
              }
            }
          }
        });
      }
    }, 100);

    return `
      <div class="jarvis-chart">
        <canvas id="${chartId}"></canvas>
      </div>
    `;
  }

  addMessage(sender, content) {
    const message = {
      id: Date.now(),
      sender,
      content,
      timestamp: new Date()
    };

    this.messages.push(message);
    this.renderMessage(message);
    this.saveChatHistory();
    this.scrollToBottom();
  }

  renderMessage(message) {
    const messagesContainer = document.getElementById('jarvisMessages');
    const messageEl = document.createElement('div');
    messageEl.className = `jarvis-message ${message.sender}`;
    
    const time = new Date(message.timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    });

    messageEl.innerHTML = `
      <div class="jarvis-message-avatar">
        ${message.sender === 'user' ? 'U' : '🤖'}
      </div>
      <div class="jarvis-message-content">
        ${this.context.filters.startDate && message.sender === 'ai' ? `
          <div class="jarvis-context-badge">
            📅 ${this.formatDateRange(this.context.filters.startDate, this.context.filters.endDate)}
          </div>
        ` : ''}
        ${message.content}
        <div class="jarvis-message-time">${time}</div>
      </div>
    `;

    messagesContainer.appendChild(messageEl);
  }

  showTyping() {
    this.isTyping = true;
    const typingEl = document.createElement('div');
    typingEl.className = 'jarvis-message ai';
    typingEl.id = 'jarvisTyping';
    typingEl.innerHTML = `
      <div class="jarvis-message-avatar">🤖</div>
      <div class="jarvis-message-content">
        <div class="jarvis-typing">
          <div class="jarvis-typing-dot"></div>
          <div class="jarvis-typing-dot"></div>
          <div class="jarvis-typing-dot"></div>
        </div>
      </div>
    `;
    document.getElementById('jarvisMessages').appendChild(typingEl);
    this.scrollToBottom();
  }

  hideTyping() {
    this.isTyping = false;
    const typingEl = document.getElementById('jarvisTyping');
    if (typingEl) typingEl.remove();
  }

  scrollToBottom() {
    const messages = document.getElementById('jarvisMessages');
    messages.scrollTop = messages.scrollHeight;
  }

  updateContext() {
    // Get current filters from dashboard
    const urlParams = new URLSearchParams(window.location.search);
    this.context.filters = {
      startDate: urlParams.get('startDate'),
      endDate: urlParams.get('endDate'),
      campaign: urlParams.get('campaign'),
      source: urlParams.get('source'),
      medium: urlParams.get('medium')
    };

    // Get current view
    const path = window.location.pathname;
    if (path.includes('dashboard')) this.context.currentView = 'dashboard';
    else if (path.includes('analytics')) this.context.currentView = 'analytics';
    else if (path.includes('journey')) this.context.currentView = 'journey';
    else if (path.includes('campaigns')) this.context.currentView = 'campaigns';
  }

  showWelcomeMessage() {
    const hour = new Date().getHours();
    let greeting = 'Good day';
    if (hour < 12) greeting = 'Good morning';
    else if (hour < 17) greeting = 'Good afternoon';
    else greeting = 'Good evening';

    const welcomeMessage = `${greeting}! 👋 I'm Jarvis, your AI analytics assistant. 

I can help you:
• Analyze your tracking data and campaigns
• Identify trends and anomalies
• Understand user journeys
• Make data-driven recommendations

What would you like to know about your data?`;

    setTimeout(() => {
      this.addMessage('ai', welcomeMessage);
    }, 500);
  }

  toggleVoiceInput() {
    const voiceBtn = document.getElementById('jarvisVoice');
    
    if (!('webkitSpeechRecognition' in window)) {
      alert('Voice input is not supported in your browser. Please use Chrome.');
      return;
    }

    if (this.recognition && this.recognition.isRecording) {
      this.recognition.stop();
      voiceBtn.classList.remove('recording');
      return;
    }

    this.recognition = new webkitSpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.lang = 'en-US';
    this.recognition.isRecording = true;

    voiceBtn.classList.add('recording');

    this.recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      document.getElementById('jarvisInput').value = transcript;
      voiceBtn.classList.remove('recording');
      this.sendMessage();
    };

    this.recognition.onerror = () => {
      voiceBtn.classList.remove('recording');
      alert('Voice recognition failed. Please try again.');
    };

    this.recognition.onend = () => {
      voiceBtn.classList.remove('recording');
      this.recognition.isRecording = false;
    };

    this.recognition.start();
  }

  saveChatHistory() {
    const history = this.messages.slice(-50); // Keep last 50 messages
    localStorage.setItem('jarvis_chat_history', JSON.stringify(history));
  }

  loadChatHistory() {
    const history = localStorage.getItem('jarvis_chat_history');
    if (history) {
      this.messages = JSON.parse(history);
      this.messages.forEach(msg => this.renderMessage(msg));
    }
  }

  formatDateRange(start, end) {
    const startDate = new Date(start);
    const endDate = new Date(end || new Date());
    
    const options = { month: 'short', day: 'numeric' };
    return `${startDate.toLocaleDateString('en-US', options)} - ${endDate.toLocaleDateString('en-US', options)}`;
  }

  getDefaultStartDate() {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString();
  }
}

// Initialize Jarvis when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Check if API key is available
  const apiKey = localStorage.getItem('openai_api_key');
  if (!apiKey) {
    console.warn('OpenAI API key not found. Please set it in settings.');
    return;
  }

  // Initialize Jarvis AI
  window.jarvis = new JarvisAI(apiKey);
});