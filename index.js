// Бесплатный AI сервер для сайта "Доска Позора"
// Использует Groq API (100% бесплатно, без кредитной карты)

export default async function handler(req, res) {
  // CORS headers - разрешаем запросы с вашего сайта
  const allowedOrigins = [
    'https://bruce22crz.github.io',
    'http://localhost:3000',
    'http://localhost:5500',
    'http://127.0.0.1:5500'
  ];
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*'); // Fallback для всех
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Health check endpoint
  if (req.url === '/health') {
    return res.status(200).json({
      status: 'ok',
      api: 'Groq',
      timestamp: new Date().toISOString()
    });
  }

  // Chat endpoint
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Invalid messages format' });
    }

    // Groq API key from environment
    const GROQ_API_KEY = process.env.GROQ_API_KEY;

    if (!GROQ_API_KEY) {
      return res.status(500).json({ 
        error: 'API key not configured',
        message: 'Администратор должен добавить GROQ_API_KEY в настройках Vercel'
      });
    }

    // Call Groq API
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile', // Бесплатная быстрая модель
        messages: messages,
        temperature: 0.7,
        max_tokens: 1024,
        stream: false
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Groq API error:', error);
      return res.status(response.status).json({ 
        error: 'AI API error',
        details: error
      });
    }

    const data = await response.json();
    const aiMessage = data.choices[0]?.message?.content || 'Извините, не могу ответить.';

    return res.status(200).json({
      content: [
        {
          type: 'text',
          text: aiMessage
        }
      ],
      model: 'Llama 3.3 70B (Groq)'
    });

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message
    });
  }
}
