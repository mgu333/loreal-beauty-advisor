# L'Oréal Beauty Advisor AI 💄

AI-powered L'Oréal Beauty Advisor chatbot providing personalized product recommendations and beauty guidance using OpenAI GPT.

![L'Oréal Beauty Advisor](https://img.shields.io/badge/L'Oréal-Beauty_Advisor-E2231A?style=for-the-badge&logo=loreal&logoColor=white)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT--3.5-412991?style=for-the-badge&logo=openai&logoColor=white)
![Cloudflare](https://img.shields.io/badge/Cloudflare-Workers-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)

## 🌟 Features

### ✨ Professional L'Oréal Branding
- **Branded UI**: Black, white, red, and gold color scheme matching L'Oréal's iconic brand identity
- **Premium Design**: Elegant and sophisticated interface befitting a luxury beauty brand
- **Responsive Layout**: Seamlessly adapts to mobile, tablet, and desktop devices

### 💬 Intelligent Chat Interface
- **Chat Bubbles**: Clean, modern conversation interface
- **Conversation History**: Persistent chat storage with localStorage
- **Multiple Chats**: Support for multiple concurrent conversations
- **Search Functionality**: Find past conversations quickly
- **Favorite Chats**: Mark important conversations for easy access

### 🤖 AI-Powered Recommendations
- **OpenAI GPT Integration**: Powered by GPT-3.5-turbo for intelligent responses
- **Beauty Expertise**: Specialized prompts for skincare, makeup, and haircare advice
- **Personalized Suggestions**: Context-aware recommendations based on user needs
- **Product Knowledge**: Informed about various beauty products and ingredients

### 🔒 Security & Privacy
- **Cloudflare Worker**: Secure API proxy to protect OpenAI API keys
- **CORS Protection**: Origin validation for API requests
- **Rate Limiting**: Built-in request validation and size limits
- **Error Handling**: Graceful error messages without exposing sensitive data

### 📱 User Experience
- **Loading Indicators**: Animated typing indicators while AI processes requests
- **Error Handling**: Clear, user-friendly error messages
- **Mobile-First Design**: Touch-optimized interface for mobile devices
- **Keyboard Shortcuts**: Press Enter to send messages, Shift+Enter for new lines
- **Auto-Resizing Input**: Textarea grows with content up to a maximum height

## 🚀 Quick Start

### Prerequisites
- A modern web browser (Chrome, Firefox, Safari, Edge)
- OpenAI API key ([Get one here](https://platform.openai.com/api-keys))
- Cloudflare account ([Sign up here](https://dash.cloudflare.com/sign-up))

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/mgu333/loreal-beauty-advisor.git
   cd loreal-beauty-advisor
   ```

2. **Open locally**
   - Simply open `index.html` in your web browser
   - Or use a local server:
     ```bash
     # Using Python 3
     python -m http.server 8000
     
     # Using Node.js (with http-server)
     npx http-server -p 8000
     
     # Using PHP
     php -S localhost:8000
     ```

3. **Access the app**
   - Navigate to `http://localhost:8000`

### Cloudflare Worker Deployment

1. **Install Wrangler CLI**
   ```bash
   npm install -g wrangler
   ```

2. **Login to Cloudflare**
   ```bash
   wrangler login
   ```

3. **Create wrangler.toml configuration**
   ```toml
   name = "loreal-beauty-advisor-api"
   main = "worker.js"
   compatibility_date = "2024-01-01"
   
   [vars]
   # Optional: Set allowed origins (comma-separated)
   # ALLOWED_ORIGINS = "https://yourdomain.com,https://www.yourdomain.com"
   ```

4. **Set OpenAI API Key as Secret**
   ```bash
   wrangler secret put OPENAI_API_KEY
   # Enter your OpenAI API key when prompted
   ```

5. **Deploy the Worker**
   ```bash
   wrangler deploy
   ```

6. **Update Frontend API Endpoint**
   - Note the Worker URL from deployment (e.g., `https://loreal-beauty-advisor-api.your-subdomain.workers.dev`)
   - Update `app.js` line 244 to use your Worker URL:
     ```javascript
     const response = await fetch('https://your-worker-url.workers.dev/api/chat', {
     ```

### Hosting Options

#### GitHub Pages
1. Push code to GitHub repository
2. Go to repository Settings → Pages
3. Select branch and root directory
4. Your site will be available at `https://username.github.io/repository-name`

#### Cloudflare Pages
1. Connect your GitHub repository to Cloudflare Pages
2. Deploy with default settings (no build command needed)
3. Add environment variables in Pages settings if needed

#### Netlify
1. Connect your GitHub repository
2. Deploy with default settings
3. Site will be available at custom Netlify URL

## 🎨 Customization

### Updating Brand Colors
Edit the CSS variables in `styles.css`:
```css
:root {
    --loreal-black: #000000;
    --loreal-white: #FFFFFF;
    --loreal-red: #E2231A;
    --loreal-gold: #D4AF37;
}
```

### Modifying AI Personality
Update the system prompt in `worker.js`:
```javascript
const SYSTEM_PROMPT = `Your custom prompt here...`;
```

### Adjusting AI Model
In `worker.js`, modify the OpenAI API call:
```javascript
model: 'gpt-4', // or 'gpt-3.5-turbo'
temperature: 0.7, // 0.0 to 2.0
max_tokens: 500, // Response length
```

## 📁 Project Structure

```
loreal-beauty-advisor/
├── index.html          # Main HTML structure
├── styles.css          # L'Oréal branded styles
├── app.js             # Frontend JavaScript logic
├── worker.js          # Cloudflare Worker (API proxy)
├── README.md          # This file
└── wrangler.toml      # Cloudflare Worker configuration (create this)
```

## 🛠️ Technical Stack

- **Frontend**: Vanilla HTML5, CSS3, JavaScript (ES6+)
- **Fonts**: Google Fonts (Montserrat)
- **Icons**: Inline SVG icons
- **Storage**: localStorage for chat persistence
- **API**: OpenAI GPT-3.5-turbo
- **Proxy**: Cloudflare Workers
- **Hosting**: Static hosting (GitHub Pages, Cloudflare Pages, Netlify)

## 🔧 API Configuration

### OpenAI API Settings
The application uses the following OpenAI configuration:
- **Model**: `gpt-3.5-turbo`
- **Temperature**: `0.7` (balanced creativity/consistency)
- **Max Tokens**: `500` (concise responses)
- **Context Window**: Last 10 messages + system prompt

### Rate Limits
- Maximum message length: 1000 characters
- Context includes last 10 conversation messages
- Adjust these limits in `worker.js` as needed

## 📱 Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## 🐛 Troubleshooting

### "Failed to get AI response" Error
- Verify your OpenAI API key is correctly set in Cloudflare Worker secrets
- Check Worker deployment logs: `wrangler tail`
- Ensure you have API credits in your OpenAI account

### Chat History Not Saving
- Check browser localStorage is enabled
- Clear browser cache and try again
- Verify no browser extensions are blocking storage

### Mobile Sidebar Not Opening
- Check browser console for JavaScript errors
- Ensure viewport meta tag is present in HTML
- Try clearing browser cache

### CORS Errors
- Verify Worker URL matches the one in `app.js`
- Check ALLOWED_ORIGINS environment variable in Worker
- Ensure proper CORS headers are returned

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- L'Oréal for the iconic brand inspiration
- OpenAI for the GPT API
- Cloudflare for Workers platform
- The open-source community

## 📞 Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Contact: [Your Email]

---

**"Because You're Worth It"** ✨

Made with ❤️ for beauty enthusiasts everywhere
