/**
 * L'Oréal Beauty Advisor - Cloudflare Worker
 * 
 * This worker acts as a secure proxy between the frontend and OpenAI API.
 * It protects the API key from exposure and adds additional security controls.
 * 
 * Environment Variables Required:
 * - OPENAI_API_KEY: Your OpenAI API key
 * - ALLOWED_ORIGINS: Comma-separated list of allowed origins (optional)
 */

// Beauty advisor system prompt
const SYSTEM_PROMPT = `You are a professional L'Oréal Beauty Advisor AI assistant. Your role is to provide expert beauty advice, product recommendations, and personalized consultations.

Key responsibilities:
- Provide personalized skincare, makeup, and haircare recommendations
- Suggest L'Oréal products when appropriate (but be honest about all quality products)
- Ask clarifying questions about skin type, concerns, preferences, and lifestyle
- Educate customers about ingredients, application techniques, and beauty routines
- Be warm, professional, and empowering in your communication
- Always recommend consulting with a dermatologist for serious skin concerns
- Consider factors like skin type, age, climate, and personal preferences

Product categories you can recommend:
- Skincare: cleansers, moisturizers, serums, sunscreens, treatments
- Makeup: foundations, concealers, lipsticks, eyeshadows, mascaras
- Haircare: shampoos, conditioners, treatments, styling products, color

Remember: "Because You're Worth It" - make every customer feel valued and beautiful.`;

export default {
    async fetch(request, env, ctx) {
        return handleRequest(request, env);
    }
};

async function handleRequest(request, env) {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
        return handleCORS(request, env);
    }

    // Only allow POST requests
    if (request.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 });
    }

    // Check origin
    const origin = request.headers.get('Origin');
    if (!isOriginAllowed(origin, env)) {
        return new Response('Origin not allowed', { status: 403 });
    }

    try {
        // Parse request body
        const body = await request.json();
        const { userMessage, messages = [] } = body;

        // Validate input
        if (!userMessage || typeof userMessage !== 'string') {
            return new Response(
                JSON.stringify({ error: 'Invalid request: userMessage is required' }),
                { status: 400, headers: getCORSHeaders(origin) }
            );
        }

        // Enforce rate limiting (basic implementation)
        if (userMessage.length > 1000) {
            return new Response(
                JSON.stringify({ error: 'Message too long. Please keep messages under 1000 characters.' }),
                { status: 400, headers: getCORSHeaders(origin) }
            );
        }

        // Build conversation history
        const conversationMessages = [
            { role: 'system', content: SYSTEM_PROMPT }
        ];

        // Add previous messages (limit to last 10 for context window management)
        const recentMessages = messages.slice(-10);
        conversationMessages.push(...recentMessages);

        // Add the new user message
        conversationMessages.push({
            role: 'user',
            content: userMessage
        });

        // Call OpenAI API
        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${env.OPENAI_API_KEY}`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: conversationMessages,
                temperature: 0.7,
                max_tokens: 500,
                top_p: 1,
                frequency_penalty: 0.5,
                presence_penalty: 0.5
            })
        });

        if (!openaiResponse.ok) {
            const errorData = await openaiResponse.text();
            console.error('OpenAI API Error:', errorData);
            
            // Don't expose API errors to client
            return new Response(
                JSON.stringify({ 
                    error: 'Sorry, I\'m having trouble connecting right now. Please try again in a moment.',
                    message: 'I apologize, but I\'m experiencing technical difficulties. Please try again shortly.'
                }),
                { 
                    status: 500, 
                    headers: getCORSHeaders(origin)
                }
            );
        }

        const data = await openaiResponse.json();
        const assistantMessage = data.choices[0].message.content;

        // Return the response
        return new Response(
            JSON.stringify({ message: assistantMessage }),
            {
                status: 200,
                headers: getCORSHeaders(origin)
            }
        );

    } catch (error) {
        console.error('Worker Error:', error);
        
        return new Response(
            JSON.stringify({ 
                error: 'An error occurred processing your request',
                message: 'I apologize, but something went wrong. Please try again.'
            }),
            {
                status: 500,
                headers: getCORSHeaders(request.headers.get('Origin'))
            }
        );
    }
}

function handleCORS(request, env) {
    const origin = request.headers.get('Origin');
    
    if (!isOriginAllowed(origin, env)) {
        return new Response('Origin not allowed', { status: 403 });
    }

    return new Response(null, {
        status: 204,
        headers: getCORSHeaders(origin)
    });
}

function getCORSHeaders(origin) {
    return {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': origin || '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400'
    };
}

function isOriginAllowed(origin, env) {
    // In production, check against ALLOWED_ORIGINS environment variable
    if (env.ALLOWED_ORIGINS) {
        const allowedOrigins = env.ALLOWED_ORIGINS.split(',').map(o => o.trim());
        return allowedOrigins.includes(origin);
    }
    
    // If no ALLOWED_ORIGINS set, allow all for development
    // WARNING: Set ALLOWED_ORIGINS in production for security
    // For production without ALLOWED_ORIGINS, you can return false to block all
    // or implement additional origin validation logic
    console.warn('ALLOWED_ORIGINS not set - allowing all origins. Set this in production!');
    return true;
}
