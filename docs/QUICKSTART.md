# Quick Start Guide

## Get Running in 3 Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Server
```bash
npm start
```

Server will start at: http://localhost:3000

### 3. Test the Game

Open `example-client.html` in your browser, or use curl:

```bash
# Create a game
curl -X POST http://localhost:3000/api/game/create \
  -H "Content-Type: application/json" \
  -d '{"mapWidth":64,"mapHeight":64,"aiDifficulty":"medium"}'

# Start the game (use the gameId from above)
curl -X POST http://localhost:3000/api/game/GAME_ID/start

# Get game state
curl http://localhost:3000/api/game/GAME_ID/state
```

## What You Get

- ✅ Real-time strategy game backend
- ✅ AI opponent with 3 difficulty levels
- ✅ Procedural map generation
- ✅ 4 unit types + 5 building types
- ✅ RESTful API for easy integration
- ✅ Ready for Lovable deployment

## Next Steps

1. **Test locally** - Use example-client.html
2. **Deploy** - Follow DEPLOYMENT.md
3. **Integrate** - Connect to your Lovable frontend
4. **Build UI** - Add visual rendering and controls
5. **Submit** - Enter the Chroma Awards!

## Need Help?

- Check README.md for full documentation
- See DEPLOYMENT.md for hosting instructions
- Review example-client.html for API usage

Good luck! 🎮
