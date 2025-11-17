# Quaternion Deployment Guide

## 🚀 Deploying to Lovable Cloud

This game is optimized for Lovable Cloud deployment. Follow these steps:

### Prerequisites

- Lovable account
- Git repository connected to Lovable
- Node.js 18+ installed locally (for testing)

### Deployment Steps

#### Option 1: Direct Lovable Deployment (Recommended)

1. **Connect Repository**
   - Go to [Lovable Dashboard](https://lovable.dev)
   - Create new project or connect existing repository
   - Link this repository

2. **Configure Project**
   - Project Type: React + Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

3. **Deploy**
   - Click "Deploy" in Lovable dashboard
   - Wait for build to complete (~2-3 minutes)
   - Access your game at the provided URL

4. **Custom Domain (Optional)**
   - Go to Project > Settings > Domains
   - Click "Connect Domain"
   - Follow DNS configuration instructions

#### Option 2: Manual Build & Upload

1. **Build Locally**
   ```bash
   npm install
   npm run build
   ```

2. **Upload to Lovable**
   - Zip the `dist` folder
   - Upload via Lovable dashboard
   - Configure routing for SPA

### Environment Variables

No environment variables required for basic deployment.

For advanced features (optional):
- `VITE_API_URL`: Backend API URL (if using separate backend)
- `VITE_ANALYTICS_ID`: Analytics tracking ID

### Post-Deployment Checklist

- [ ] Game loads correctly at root URL
- [ ] Navigation to `/quaternion` works
- [ ] All assets (images, fonts) load properly
- [ ] Game controls respond correctly
- [ ] Replay system generates artifacts
- [ ] Judge HUD displays correctly

### Troubleshooting

**Issue**: 404 errors on page refresh

**Solution**: Configure Lovable for SPA routing:
- Add `_redirects` file to `public` folder:
  ```
  /*    /index.html   200
  ```

**Issue**: Large bundle size warning

**Solution**: This is expected for Phaser games. The game is optimized and will load quickly on modern connections.

**Issue**: Game doesn't start

**Solution**: 
- Check browser console for errors
- Ensure WebGL is supported
- Try different browser
- Clear cache and reload

## 🌐 Alternative Deployment Options

### Netlify

```bash
# Build
npm run build

# Deploy
netlify deploy --prod --dir=dist
```

### Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### GitHub Pages

```bash
# Install gh-pages
npm install -D gh-pages

# Add to package.json scripts:
# "deploy": "gh-pages -d dist"

# Deploy
npm run deploy
```

### Static Hosting (AWS S3, Cloudflare Pages, etc.)

1. Build: `npm run build`
2. Upload `dist` folder contents
3. Configure for SPA routing
4. Set cache headers for assets

## 📊 Performance Optimization

### Already Implemented

- ✅ Code splitting
- ✅ Asset compression
- ✅ Tree shaking
- ✅ Minification
- ✅ Lazy loading

### Recommended CDN Settings

- Cache static assets: 1 year
- Cache HTML: 5 minutes
- Enable Brotli compression
- Enable HTTP/2

## 🔒 Security Considerations

- No sensitive data in client code
- All game logic runs client-side
- Replay system uses content hashing
- No external API calls required

## 📈 Monitoring

### Recommended Tools

- **Lovable Analytics**: Built-in dashboard
- **Google Analytics**: Add tracking ID
- **Sentry**: Error tracking (optional)
- **LogRocket**: Session replay (optional)

### Key Metrics to Track

- Page load time
- Game initialization time
- Average session duration
- Replay generation success rate
- Browser/device distribution

## 🔄 Updates & Maintenance

### Updating the Game

1. Make changes locally
2. Test thoroughly: `npm run dev`
3. Build: `npm run build`
4. Commit and push to repository
5. Lovable auto-deploys (if configured)

### Rollback Procedure

1. Go to Lovable dashboard
2. Navigate to Deployments
3. Select previous working deployment
4. Click "Rollback"

## 📞 Support

- **Lovable Docs**: https://docs.lovable.dev
- **Game Issues**: Check GitHub issues
- **Deployment Help**: Lovable support chat

---

**Ready to deploy? Let's go! 🚀**
