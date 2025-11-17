# Deployment Guide for Lovable

This guide will help you deploy the Chroma Strategy Game backend to work with your Lovable frontend.

## Quick Start

### Local Development

1. **Install dependencies**
```bash
npm install
```

2. **Start the server**
```bash
npm start
```

3. **Test the API**
Open `example-client.html` in your browser to test the game.

### Deploy to Production

The backend can be deployed to any Node.js hosting platform. Here are the most popular options:

## Option 1: Railway (Recommended)

Railway is free, fast, and easy to use.

1. **Create a Railway account** at https://railway.app
2. **Install Railway CLI**
```bash
npm install -g @railway/cli
```

3. **Login and deploy**
```bash
railway login
railway init
railway up
```

4. **Get your deployment URL**
```bash
railway domain
```

Your API will be available at: `https://your-app.railway.app/api`

## Option 2: Render

1. Go to https://render.com
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: Node
5. Click "Create Web Service"

Your API will be available at: `https://your-app.onrender.com/api`

## Option 3: Heroku

1. Install Heroku CLI: https://devcenter.heroku.com/articles/heroku-cli
2. Login and create app:
```bash
heroku login
heroku create your-app-name
git push heroku main
```

Your API will be available at: `https://your-app-name.herokuapp.com/api`

## Option 4: Vercel (Serverless)

For Vercel, you'll need to create a `vercel.json`:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "src/index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "src/index.js"
    }
  ]
}
```

Then deploy:
```bash
npm install -g vercel
vercel
```

## Connecting to Lovable Frontend

Once deployed, update your Lovable frontend to use the deployed API:

```javascript
// In your Lovable project
const API_URL = 'https://your-deployed-backend.com/api';

// Create a game
const response = await fetch(`${API_URL}/game/create`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    mapWidth: 64,
    mapHeight: 64,
    aiDifficulty: 'medium'
  })
});

const { gameId, state } = await response.json();
```

## Environment Variables

Set these on your hosting platform:

- `PORT` - Server port (usually auto-set by platform)
- `NODE_ENV` - Set to `production`

## API Documentation

### Base URL
```
https://your-deployed-backend.com/api
```

### Key Endpoints

#### Health Check
```
GET /health
```

#### Create Game
```
POST /game/create
Body: { mapWidth: 64, mapHeight: 64, aiDifficulty: "medium" }
```

#### Start Game
```
POST /game/:id/start
```

#### Get Game State
```
GET /game/:id/state
```

#### Send Commands
```
POST /game/:id/move
POST /game/:id/attack
POST /game/:id/gather
POST /game/:id/build-unit
POST /game/:id/build-building
```

## Performance Tips

1. **Polling Rate**: Poll game state at 200ms intervals (5 times per second)
2. **Command Batching**: Batch multiple commands in a single request when possible
3. **State Caching**: Cache map data (it doesn't change) to reduce requests

## Troubleshooting

### CORS Issues
The backend has CORS enabled by default. If you encounter issues:
- Check that your frontend URL is making requests to the correct backend URL
- Ensure the backend is running and accessible

### Game Not Starting
- Verify the game was created successfully
- Check that you called `/game/:id/start` before polling state
- Look at server logs for errors

### High Latency
- Choose a hosting region close to your users
- Consider upgrading to a paid tier for better performance
- Reduce polling frequency if needed

## Monitoring

Check your game server health:
```bash
curl https://your-backend.com/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": 1699999999999
}
```

## Scaling

For production use with many concurrent games:

1. **Add Redis** for game state persistence
2. **Use WebSockets** instead of polling
3. **Implement rate limiting**
4. **Add authentication**
5. **Set up monitoring** (e.g., Datadog, New Relic)

## Support

For issues or questions:
- Check the README.md for API documentation
- Review example-client.html for usage examples
- Test locally before deploying

## Next Steps

After deployment:
1. Test all API endpoints
2. Integrate with your Lovable frontend
3. Add game UI and controls
4. Implement visualization for units and buildings
5. Add sound effects and music
6. Submit to Chroma Awards! 🎮

Good luck with your submission!
