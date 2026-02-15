// Бесплатный AI Proxy Server
// Использует полностью бесплатные API без кредитной карты

const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: '*' }));
app.use(express.json());

// ==========================================
// БЕСПЛАТНЫЕ AI API (выберите один)
// ==========================================

// Вариант 1: Groq (БЕСПЛАТНО, без карты, быстрый!)
// Зарегистрируйтесь на https://console.groq.com/
const GROQ_API_KEY = process.env.GROQ_API_KEY || '';

// Вариант 2: Hugging Face (БЕСПЛАТНО, без карты)
// Зарегистрируйтесь на https://huggingface.co/settings/tokens
const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY || '';

// Вариант 3: Together AI (БЕСПЛАТНО $25 кредитов)
// Зарегистрируйтесь на https://api.together.xyz/
const TOGETHER_API_KEY = process.env.TOGETHER_API_KEY || '';

// ==========================================
// GROQ API (Рекомендуется - самый быстрый)
// ==========================================
async function chatWithGroq(messages) {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${GROQ_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: 'llama-3.3-70b-versatile', // Очень умная модель
            messages: messages,
            max_tokens: 1000,
            temperature: 0.7
        })
    });

    if (!response.ok) {
        throw new Error(`Groq API error: ${response.status}`);
    }

    const data = await response.json();
    return {
        content: [{
            type: 'text',
            text: data.choices[0].message.content
        }]
    };
}

// ==========================================
// HUGGING FACE API
// ==========================================
async function chatWithHuggingFace(messages) {
    const lastMessage = messages[messages.length - 1].content;
    
    const response = await fetch('https://api-inference.huggingface.co/models/microsoft/DialoGPT-large', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${HUGGINGFACE_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            inputs: lastMessage
        })
    });

    if (!response.ok) {
        throw new Error(`HuggingFace API error: ${response.status}`);
    }

    const data = await response.json();
    return {
        content: [{
            type: 'text',
            text: data[0].generated_text
        }]
    };
}

// ==========================================
// TOGETHER AI API
// ==========================================
async function chatWithTogether(messages) {
    const response = await fetch('https://api.together.xyz/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${TOGETHER_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo',
            messages: messages,
            max_tokens: 1000
        })
    });

    if (!response.ok) {
        throw new Error(`Together AI error: ${response.status}`);
    }

    const data = await response.json();
    return {
        content: [{
            type: 'text',
            text: data.choices[0].message.content
        }]
    };
}

// ==========================================
// DEMO MODE (работает без API ключей)
// ==========================================
function chatDemo(messages) {
    const userMessage = messages[messages.length - 1].content.toLowerCase();
    
    const responses = {
        'привет': 'Привет! 👋 Я ИИ помощник. Чем могу помочь?',
        'как дела': 'У меня всё отлично, спасибо! А у вас?',
        'анекдот': '- Алло, это зоопарк?\n- Да.\n- А у вас жираф есть?\n- Есть.\n- А говорить умеет?\n- Нет.\n- А тогда кто мне только что ответил? 🦒😄',
        'код': 'Конечно! Вот пример на JavaScript:\n\n```javascript\nfunction greet(name) {\n    return `Привет, ${name}!`;\n}\n\nconsole.log(greet("Мир"));\n```',
        'совет': '**Совет дня**: Начинайте день с чего-то приятного - улыбки, музыки или доброго дела! 😊',
        'помощь': 'Я могу помочь с:\n• Ответами на вопросы\n• Программированием\n• Советами\n• И многим другим!\n\nПросто спрашивайте!',
        'кто ты': 'Я ИИ помощник, созданный чтобы помогать людям. Работаю на современных языковых моделях!',
        'спасибо': 'Пожалуйста! Рад помочь! 😊',
        'пока': 'До свидания! Возвращайтесь если понадоблюсь! 👋'
    };
    
    // Ищем ключевое слово
    for (const [keyword, response] of Object.entries(responses)) {
        if (userMessage.includes(keyword)) {
            return {
                content: [{
                    type: 'text',
                    text: response
                }]
            };
        }
    }
    
    // Дефолтный ответ
    const defaults = [
        `Вы сказали: "${messages[messages.length - 1].content}"\n\nЭто интересный вопрос! Я работаю в демо-режиме. Добавьте API ключ для полноценных ответов.`,
        'Я понял ваш вопрос! В демо-режиме мои возможности ограничены. Попробуйте спросить про анекдот, код или совет!',
        'Интересно! Для лучших ответов настройте API ключ (Groq, Together AI или HuggingFace).',
        'Понял! 👍 Хотите услышать анекдот, получить совет или помощь с кодом?'
    ];
    
    return {
        content: [{
            type: 'text',
            text: defaults[Math.floor(Math.random() * defaults.length)]
        }]
    };
}

// ==========================================
// MAIN ENDPOINT
// ==========================================
app.post('/api/chat', async (req, res) => {
    try {
        const { messages } = req.body;
        
        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: 'Invalid request' });
        }

        let result;

        // Пробуем API в порядке приоритета
        if (GROQ_API_KEY) {
            console.log('Using Groq API');
            result = await chatWithGroq(messages);
        } else if (TOGETHER_API_KEY) {
            console.log('Using Together AI');
            result = await chatWithTogether(messages);
        } else if (HUGGINGFACE_API_KEY) {
            console.log('Using HuggingFace');
            result = await chatWithHuggingFace(messages);
        } else {
            console.log('Using Demo Mode');
            result = chatDemo(messages);
        }

        res.json(result);

    } catch (error) {
        console.error('Error:', error);
        
        // В случае ошибки используем демо
        const demoResult = chatDemo(req.body.messages);
        res.json(demoResult);
    }
});

app.get('/health', (req, res) => {
    const activeAPI = GROQ_API_KEY ? 'Groq' : 
                      TOGETHER_API_KEY ? 'Together AI' : 
                      HUGGINGFACE_API_KEY ? 'HuggingFace' : 
                      'Demo';
    
    res.json({ 
        status: 'ok', 
        api: activeAPI,
        timestamp: new Date().toISOString() 
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 Active API: ${GROQ_API_KEY ? 'Groq' : TOGETHER_API_KEY ? 'Together' : HUGGINGFACE_API_KEY ? 'HuggingFace' : 'Demo Mode'}`);
});

module.exports = app;
