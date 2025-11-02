# Deployment Guide - L'Oréal Beauty Advisor

This guide provides detailed instructions for deploying the L'Oréal Beauty Advisor chatbot to production.

## Table of Contents
1. [Cloudflare Worker Setup](#cloudflare-worker-setup)
2. [Frontend Deployment](#frontend-deployment)
3. [Environment Configuration](#environment-configuration)
4. [Testing Deployment](#testing-deployment)
5. [Troubleshooting](#troubleshooting)

---

## Cloudflare Worker Setup

The Cloudflare Worker acts as a secure proxy for OpenAI API calls, protecting your API key from exposure.

### Step 1: Install Wrangler CLI

```bash
npm install -g wrangler
```

### Step 2: Authenticate with Cloudflare

```bash
wrangler login
```

This will open a browser window for authentication.

### Step 3: Configure Worker

The `wrangler.toml` file is already configured. Review and update if needed:

```toml
name = "loreal-beauty-advisor-api"
main = "worker.js"
compatibility_date = "2024-01-01"
```

### Step 4: Set API Key as Secret

**Important**: Never commit your API key to version control!

```bash
wrangler secret put OPENAI_API_KEY
```

When prompted, paste your OpenAI API key.

### Step 5: Deploy Worker

```bash
wrangler deploy
```

After deployment, you'll receive a URL like:
```
https://loreal-beauty-advisor-api.your-subdomain.workers.dev
```

**Save this URL** - you'll need it for frontend configuration.

### Step 6: Test Worker

Test your worker deployment:

```bash
curl -X POST https://your-worker-url.workers.dev/api/chat \
  -H "Content-Type: application/json" \
  -d '{"userMessage": "Hello, what skincare products do you recommend?"}'
```

---

## Frontend Deployment

Choose one of the following deployment methods:

### Option 1: GitHub Pages (Recommended for beginners)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial deployment"
   git push origin main
   ```

2. **Enable GitHub Pages**
   - Go to repository Settings → Pages
   - Source: Deploy from branch
   - Branch: `main`, folder: `/` (root)
   - Click Save

3. **Update Worker URL**
   Edit `app.js` and update the API endpoint (line ~244):
   ```javascript
   const response = await fetch('https://your-worker-url.workers.dev/api/chat', {
   ```

4. **Access your site**
   - URL: `https://yourusername.github.io/loreal-beauty-advisor`
   - May take a few minutes to deploy

### Option 2: Cloudflare Pages

1. **Connect Repository**
   - Go to [Cloudflare Dashboard](https://dash.cloudflare.com) → Pages
   - Click "Create a project"
   - Connect your GitHub repository

2. **Configure Build Settings**
   - Framework preset: None
   - Build command: (leave empty)
   - Build output directory: `/`
   - Root directory: `/`

3. **Deploy**
   - Click "Save and Deploy"
   - Your site will be available at: `https://your-project.pages.dev`

4. **Update Worker URL** (if needed)
   - Edit `app.js` with your Worker URL
   - Commit and push to trigger redeployment

### Option 3: Netlify

1. **Connect Repository**
   - Go to [Netlify](https://app.netlify.com)
   - Click "Add new site" → "Import an existing project"
   - Connect your GitHub repository

2. **Configure Build Settings**
   - Build command: (leave empty)
   - Publish directory: `/`

3. **Deploy**
   - Click "Deploy site"
   - Site will be available at: `https://random-name.netlify.app`
   - You can customize the domain in Site settings

4. **Update Worker URL**
   - Edit `app.js` with your Worker URL
   - Commit and push to trigger redeployment

### Option 4: Custom Domain + Cloudflare

1. **Add Custom Domain to Pages**
   - In Cloudflare Pages, go to Custom domains
   - Add your domain (e.g., `beauty.yourdomain.com`)

2. **Configure DNS**
   - DNS records are automatically configured
   - Wait for propagation (can take up to 24 hours)

3. **Update ALLOWED_ORIGINS**
   ```bash
   wrangler secret put ALLOWED_ORIGINS
   ```
   Enter: `https://beauty.yourdomain.com,https://www.beauty.yourdomain.com`

---

## Environment Configuration

### Production Settings

1. **Update Worker URL in app.js**
   ```javascript
   // Line ~244 in app.js
   const response = await fetch('https://your-actual-worker-url.workers.dev/api/chat', {
   ```

2. **Set Allowed Origins (Optional but Recommended)**
   
   For production security, restrict API access to your domain:
   
   ```bash
   wrangler secret put ALLOWED_ORIGINS
   ```
   
   Enter your domain(s):
   ```
   https://yourdomain.com,https://www.yourdomain.com
   ```

3. **Verify Configuration**
   - Test the deployed site
   - Check browser console for errors
   - Verify API calls are working

### Development vs Production

**Development** (localhost):
```javascript
// app.js - use relative URL or worker URL
const response = await fetch('/api/chat', {
```

**Production**:
```javascript
// app.js - use full worker URL
const response = await fetch('https://loreal-beauty-advisor-api.workers.dev/api/chat', {
```

---

## Testing Deployment

### 1. Functionality Checklist

- [ ] Page loads without errors
- [ ] L'Oréal branding displays correctly
- [ ] Can send messages
- [ ] Receives AI responses
- [ ] Chat history saves
- [ ] New chat button works
- [ ] Search functionality works
- [ ] Favorite chats works
- [ ] Delete chats works
- [ ] Mobile responsive
- [ ] Sidebar toggle works on mobile

### 2. Performance Testing

Check loading times:
```bash
# Using curl
curl -w "@curl-format.txt" -o /dev/null -s https://yoursite.com
```

### 3. Browser Testing

Test on multiple browsers:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile Safari (iOS)
- Chrome Mobile (Android)

### 4. API Testing

Test the Worker endpoint:

```bash
# Test with curl
curl -X POST https://your-worker-url.workers.dev/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "userMessage": "What foundation would you recommend for oily skin?"
  }'
```

Expected response:
```json
{
  "message": "For oily skin, I recommend..."
}
```

---

## Troubleshooting

### Issue: Worker Returns 500 Error

**Cause**: OpenAI API key not set or invalid

**Solution**:
```bash
# Verify secrets
wrangler secret list

# Re-set API key
wrangler secret put OPENAI_API_KEY
```

### Issue: CORS Errors

**Cause**: Origin not allowed or CORS headers misconfigured

**Solution**:
1. Check browser console for exact error
2. Verify Worker URL in `app.js` is correct
3. Check ALLOWED_ORIGINS setting
4. Test without ALLOWED_ORIGINS restriction first

### Issue: Chat History Not Persisting

**Cause**: localStorage blocked or cleared

**Solution**:
1. Check browser privacy settings
2. Ensure site isn't in Incognito/Private mode
3. Check browser extensions aren't blocking storage
4. Verify no errors in console

### Issue: Mobile Sidebar Not Working

**Cause**: JavaScript error or CSS not loading

**Solution**:
1. Check browser console for errors
2. Clear browser cache
3. Verify all files are deployed
4. Test viewport meta tag is present

### Issue: Slow Response Times

**Cause**: OpenAI API latency or Worker cold start

**Solutions**:
- First request may be slower (cold start)
- Subsequent requests should be faster
- Consider upgrading to OpenAI paid tier for better performance
- Use Cloudflare Workers Paid plan for better performance

### Issue: Rate Limiting Errors

**Cause**: OpenAI API rate limits exceeded

**Solution**:
- Check OpenAI dashboard for rate limits
- Upgrade OpenAI plan if needed
- Implement additional rate limiting in Worker

---

## Monitoring and Maintenance

### Monitor Worker Logs

```bash
# View real-time logs
wrangler tail

# View recent logs
wrangler tail --format pretty
```

### Check OpenAI Usage

1. Go to [OpenAI Dashboard](https://platform.openai.com/usage)
2. Monitor API usage and costs
3. Set up usage alerts

### Update Worker

When you make changes to `worker.js`:

```bash
# Deploy updates
wrangler deploy

# Test immediately
curl -X POST https://your-worker-url.workers.dev/api/chat \
  -H "Content-Type: application/json" \
  -d '{"userMessage": "test"}'
```

### Update Frontend

For GitHub Pages:
```bash
git add .
git commit -m "Update frontend"
git push origin main
```

For Cloudflare Pages/Netlify:
```bash
git add .
git commit -m "Update frontend"
git push origin main
# Auto-deploys on push
```

---

## Security Best Practices

1. **Never commit secrets**
   - Use Wrangler secrets for API keys
   - Add `.env` to `.gitignore`

2. **Restrict origins in production**
   ```bash
   wrangler secret put ALLOWED_ORIGINS
   # Enter your production domain(s)
   ```

3. **Use HTTPS only**
   - GitHub Pages, Cloudflare Pages, and Netlify provide free SSL
   - Never serve over HTTP in production

4. **Monitor usage**
   - Set up OpenAI usage alerts
   - Monitor Cloudflare Worker analytics
   - Check for unusual traffic patterns

5. **Keep dependencies updated**
   - Regularly update Wrangler CLI
   - Monitor OpenAI API changes
   - Stay informed about Cloudflare Workers updates

---

## Support

If you encounter issues not covered here:

1. Check [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
2. Review [OpenAI API Docs](https://platform.openai.com/docs)
3. Open an issue on GitHub
4. Check project README for additional resources

---

**Happy Deploying!** 🚀
