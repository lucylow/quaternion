# Quaternion: AI-Generated Strategy Game

![Quaternion Banner](https://img.shields.io/badge/Game-Quaternion-cyan?style=for-the-badge)
![Version](https://img.shields.io/badge/Version-1.0.0-blue?style=for-the-badge)

## 🎮 Overview

**Quaternion** is a real-time strategy game that combines resource management, tactical combat, and AI-driven narrative. Players must balance four interconnected resources (Matter, Energy, Life, Knowledge) while defending against intelligent AI opponents and making moral choices that shape their path to victory.

### Key Features

- **4-Resource System**: Balance Matter, Energy, Life, and Knowledge in perfect harmony
- **Multiple Win Conditions**: Achieve victory through Equilibrium, Technology, Territory, or Moral paths
- **AI Opponents**: Face adaptive AI with multiple difficulty levels and strategic personalities
- **Procedural Generation**: Deterministic map generation using quaternion-based algorithms
- **Replay System**: Judge-ready artifacts with full game verification
- **AI Advisors**: Dynamic commentary from 5 unique commanders

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

Access the game at http://localhost:5173/quaternion

## 🎯 Game Mechanics

### Resources

| Resource | Description | Optimal Range |
|----------|-------------|---------------|
| **Matter** 🔷 | Raw material foundation | 30-70 units |
| **Energy** ⚡ | Powers all operations | 40-80 units |
| **Life** 🌿 | Biomass and unit production | 25-60 units |
| **Knowledge** 🧠 | Tech tree advancement | 35-75 units |

### Win Conditions

1. **Equilibrium Victory**: Maintain all resources within ±15% for 60 seconds
2. **Technological Victory**: Unlock Quantum Ascendancy
3. **Territorial Victory**: Hold Central Node for 90 seconds
4. **Moral Victory**: Achieve +80 moral alignment

## 🏗️ Buildings & Tech Tree

See full documentation in the game or check `src/data/quaternionData.ts`

## 🤖 AI Commanders

- **Core** (Logic): Efficiency & Strategy
- **Auren** (Empathy): Ethics & Morality
- **Lira** (Agility): Tactics & Combat
- **Virel** (Knowledge): Research & Tech
- **Kor** (Chaos): Unpredictability

## 🎬 Replay System

Generate judge-ready artifacts with:
- Deterministic replays (same seed = identical game)
- Content hashing for verification
- Moral verdicts and highlights
- Compressed JSON format

## 📦 Deployment on Lovable

This game is optimized for Lovable Cloud deployment:

1. Build: `npm run build`
2. Deploy via Lovable dashboard
3. Share your game with the world!

## 🛠️ Tech Stack

- React 18 + TypeScript
- Vite 5
- Phaser 3 (game engine)
- shadcn/ui + Tailwind CSS
- React Router 6

## 📄 License

MIT License

---

**Built for the Chroma Awards**

*Balance the Quaternion. Command your destiny.*
