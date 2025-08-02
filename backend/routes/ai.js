const express = require('express');
const router = express.Router();
const { authMiddleware: requireAuth } = require('../middleware/auth');
const { rateLimiter } = require('../middleware/rateLimiter');
const axios = require('axios');

// Rate limiter for AI endpoints (stricter limits)
const aiRateLimiter = rateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 requests per minute
  message: 'Too many AI requests, please try again later'
});

// OpenAI configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

// Validate OpenAI API key
if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your_openai_api_key_here') {
  console.warn('⚠️  OpenAI API key not configured. AI features will be disabled.');
}

// AI Chat endpoint
router.post('/chat', requireAuth, aiRateLimiter, async (req, res) => {
  try {
    if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your_openai_api_key_here') {
      return res.status(503).json({ 
        error: 'AI service not configured. Please contact administrator.' 
      });
    }

    const { message, context, conversationHistory = [] } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Build system prompt with context
    const systemPrompt = `You are Jarvis, an AI assistant for a UTM tracking analytics platform. 
    You have access to real-time data about website traffic, campaigns, conversions, and user behavior.
    
    Current context:
    - User: ${req.user.name} (${req.user.email})
    - View: ${context.currentView || 'dashboard'}
    - Date Range: ${context.filters?.startDate || 'Not set'} to ${context.filters?.endDate || 'Today'}
    - Domain: ${context.filters?.domain || 'All domains'}
    
    Current Analytics Data:
    - Total Sessions: ${context.analytics?.totalSessions || 0}
    - Unique Visitors: ${context.analytics?.uniqueVisitors || 0}
    - Page Views: ${context.analytics?.pageViews || 0}
    - Average Session Duration: ${context.analytics?.avgDuration || 0} seconds
    - Bounce Rate: ${context.analytics?.bounceRate || 0}%
    - Conversion Rate: ${context.analytics?.conversionRate || 0}%
    
    Traffic Sources:
    ${context.trafficSources?.map(s => `- ${s.source}/${s.medium}: ${s.sessions} sessions`).join('\n') || 'No traffic data available'}
    
    Top Pages:
    ${context.topPages?.map(p => `- ${p._id}: ${p.totalVisits} visits`).join('\n') || 'No page data available'}
    
    Recent Sessions: ${context.sessions?.length || 0} sessions in the selected period
    
    Instructions:
    - Provide insightful, actionable responses based on the actual data
    - Use emojis appropriately (📊 for stats, 📈 for growth, 📉 for decline, etc.)
    - Format numbers nicely (e.g., 1,234 instead of 1234)
    - When showing data, use markdown formatting
    - Be concise but helpful
    - Focus on data patterns, anomalies, and actionable insights
    - If asked about data, always reference the actual numbers from the context
    - If there's no data (all zeros), explain that tracking might not be set up yet`;

    // Prepare messages
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-10), // Include last 10 messages for context
      { role: 'user', content: message }
    ];

    // Call OpenAI API
    const response = await axios.post(OPENAI_API_URL, {
      model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
      messages,
      temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.7'),
      max_tokens: 1000,
      functions: [
        {
          name: 'analyze_data',
          description: 'Analyze tracking data and provide insights',
          parameters: {
            type: 'object',
            properties: {
              analysis_type: {
                type: 'string',
                enum: ['trends', 'anomalies', 'predictions', 'recommendations']
              },
              metrics: {
                type: 'array',
                items: { type: 'string' }
              }
            }
          }
        },
        {
          name: 'generate_report',
          description: 'Generate a formatted report',
          parameters: {
            type: 'object',
            properties: {
              report_type: {
                type: 'string',
                enum: ['summary', 'detailed', 'comparison']
              },
              period: { type: 'string' },
              metrics: {
                type: 'array',
                items: { type: 'string' }
              }
            }
          }
        }
      ],
      function_call: 'auto'
    }, {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const aiResponse = response.data.choices[0].message;

    // Log AI usage for monitoring
    console.log(`AI request by ${req.user.email}: ${message.substring(0, 50)}...`);

    res.json({
      response: aiResponse.content,
      function_call: aiResponse.function_call || null
    });

  } catch (error) {
    console.error('AI Chat Error:', error.response?.data || error.message);
    
    if (error.response?.status === 429) {
      return res.status(429).json({ 
        error: 'AI rate limit exceeded. Please try again later.' 
      });
    }
    
    if (error.response?.status === 401) {
      return res.status(503).json({ 
        error: 'AI service authentication failed. Please contact administrator.' 
      });
    }

    res.status(500).json({ 
      error: 'Failed to process AI request. Please try again.' 
    });
  }
});

// Get AI configuration (for frontend)
router.get('/config', requireAuth, (req, res) => {
  res.json({
    enabled: !!(OPENAI_API_KEY && OPENAI_API_KEY !== 'your_openai_api_key_here'),
    model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
    features: {
      voiceInput: true,
      dataAnalysis: true,
      predictiveAnalytics: true,
      anomalyDetection: true
    }
  });
});

// Analyze specific data
router.post('/analyze', requireAuth, aiRateLimiter, async (req, res) => {
  try {
    if (!OPENAI_API_KEY || OPENAI_API_KEY === 'your_openai_api_key_here') {
      return res.status(503).json({ 
        error: 'AI service not configured' 
      });
    }

    const { analysisType, data, timeframe } = req.body;

    const prompt = `Analyze the following ${analysisType} data for ${timeframe}:
    ${JSON.stringify(data, null, 2)}
    
    Provide key insights, patterns, and actionable recommendations.`;

    const response = await axios.post(OPENAI_API_URL, {
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: 'You are a data analyst specializing in web analytics and UTM tracking.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3, // Lower temperature for more factual analysis
      max_tokens: 800
    }, {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    res.json({
      analysis: response.data.choices[0].message.content
    });

  } catch (error) {
    console.error('AI Analysis Error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to analyze data' 
    });
  }
});

module.exports = router;