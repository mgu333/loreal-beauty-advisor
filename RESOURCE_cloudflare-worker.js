// ============================================
// L'ORÉAL BEAUTY ADVISOR - CLOUDFLARE WORKER
// ============================================
// This Cloudflare Worker acts as a secure proxy for OpenAI API requests
// It protects your API key by handling requests server-side
// 
// DEPLOYMENT INSTRUCTIONS:
// 1. Create a Cloudflare account at https://dash.cloudflare.com/
// 2. Install Wrangler CLI: npm install -g wrangler
// 3. Login: wrangler login
// 4. Create new Worker: wrangler init loreal-chatbot-worker
// 5. Copy this code to the worker file
// 6. Set your OpenAI API key as a secret:
//    wrangler secret put OPENAI_API_KEY
//    (paste your OpenAI API key when prompted)
// 7. Deploy: wrangler deploy
// 8. Copy the deployed Worker URL and update CLOUDFLARE_WORKER_URL in script.js
//
// SECURITY FEATURES:
// - API key stored securely in Cloudflare environment variables
// - CORS headers configured for your GitHub Pages domain
// - Request validation and error handling
// - Rate limiting can be added if needed

addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
    // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
        return handleCORS()
  }

  // Only allow POST requests
  if (request.method !== 'POST') {
        return new Response('Method Not Allowed', {
                status: 405,
                headers: {
                          'Allow': 'POST',
                          ...getCORSHeaders()
                }
        })
  }

  try {
        // Parse the incoming request
      const requestBody = await request.json()

      // Validate request has required fields
      if (!requestBody.messages || !Array.isArray(requestBody.messages)) {
              return new Response(JSON.stringify({
                        error: 'Invalid request: messages array is required'
              }), {
                        status: 400,
                        headers: {
                                    'Content-Type': 'application/json',
                                    ...getCORSHeaders()
                        }
              })
      }

      // Get OpenAI API key from environment variables
      // This is set using: wrangler secret put OPENAI_API_KEY
      const OPENAI_API_KEY = env.OPENAI_API_KEY || OPENAI_API_KEY_ENV

      if (!OPENAI_API_KEY) {
              return new Response(JSON.stringify({
                        error: 'Server configuration error: API key not set'
              }), {
                        status: 500,
                        headers: {
                                    'Content-Type': 'application/json',
                                    ...getCORSHeaders()
                        }
              })
      }

      // Forward request to OpenAI API
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
              method: 'POST',
              headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${OPENAI_API_KEY}`
              },
              body: JSON.stringify({
                        model: requestBody.model || 'gpt-3.5-turbo',
                        messages: requestBody.messages,
                        temperature: requestBody.temperature || 0.7,
                        max_tokens: requestBody.max_tokens || 500
              })
      })

      // Get response from OpenAI
      const openaiData = await openaiResponse.json()

      // Check if OpenAI returned an error
      if (!openaiResponse.ok) {
              return new Response(JSON.stringify({
                        error: openaiData.error?.message || 'OpenAI API error',
                        details: openaiData
              }), {
                        status: openaiResponse.status,
                        headers: {
                                    'Content-Type': 'application/json',
                                    ...getCORSHeaders()
                        }
              })
      }

      // Return successful response
      return new Response(JSON.stringify(openaiData), {
              status: 200,
              headers: {
                        'Content-Type': 'application/json',
                        ...getCORSHeaders()
              }
      })

  } catch (error) {
        // Handle any errors
      return new Response(JSON.stringify({
              error: 'Internal server error',
              message: error.message
      }), {
              status: 500,
              headers: {
                        'Content-Type': 'application/json',
                        ...getCORSHeaders()
              }
      })
  }
}

// CORS headers to allow requests from your GitHub Pages site
function getCORSHeaders() {
    return {
          'Access-Control-Allow-Origin': '*', // Change to your specific domain for production: 'https://mug333.github.io'
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Max-Age': '86400' // 24 hours
    }
}

// Handle CORS preflight requests
function handleCORS() {
    return new Response(null, {
          status: 204,
          headers: getCORSHeaders()
    })
}

// ============================================
// ENVIRONMENT VARIABLE ACCESS
// ============================================
// In Cloudflare Workers, environment variables are accessed via the 'env' parameter
// This is automatically provided when using the module worker format
// 
// Alternative approach for service worker format:
// Use global binding that's set when you deploy with wrangler

// ============================================
// WRANGLER.TOML CONFIGURATION (OPTIONAL)
// ============================================
// Create a wrangler.toml file in your worker directory with:
//
// name = "loreal-chatbot-worker"
// main = "index.js"
// compatibility_date = "2024-01-01"
//
// [env.production]
// name = "loreal-chatbot-worker"
//
// Then deploy with: wrangler deploy

// ============================================
// TESTING YOUR WORKER
// ============================================
// You can test your worker locally before deploying:
// 1. wrangler dev
// 2. Send a test request:
//    curl -X POST http://localhost:8787 \
//      -H "Content-Type: application/json" \
//      -d '{"messages":[{"role":"user","content":"Hello"}]}'

// ============================================
// RATE LIMITING (OPTIONAL ENHANCEMENT)
// ============================================
// To add rate limiting, you can use Cloudflare KV or Durable Objects
// Example with simple in-memory rate limiting (resets on worker restart):
/*
const rateLimits = new Map()

function checkRateLimit(ip) {
  const now = Date.now()
  const limit = 60 // requests per minute
  const windowMs = 60000 // 1 minute

  if (!rateLimits.has(ip)) {
    rateLimits.set(ip, { count: 1, resetTime: now + windowMs })
    return true
  }

  const userData = rateLimits.get(ip)

  if (now > userData.resetTime) {
    rateLimits.set(ip, { count: 1, resetTime: now + windowMs })
    return true
  }

  if (userData.count < limit) {
    userData.count++
    return true
  }

  return false
}
*/

console.log('✨ L\'Oréal Beauty Advisor Cloudflare Worker initialized successfully!');
