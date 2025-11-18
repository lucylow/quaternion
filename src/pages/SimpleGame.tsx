/**
 * Simple Game Page
 * A simplified, fully playable RTS game implementation
 */

import { useEffect, useRef } from 'react';
import { initSimpleGame } from '../frontend/simpleGameConfig';

export default function SimpleGame() {
  const gameContainer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (gameContainer.current) {
      // Ensure the container exists
      const container = document.getElementById('game-container');
      if (!container) {
        const div = document.createElement('div');
        div.id = 'game-container';
        div.style.width = '100%';
        div.style.height = '100%';
        if (gameContainer.current) {
          gameContainer.current.appendChild(div);
        }
      }

      // Initialize the game
      initSimpleGame();

      return () => {
        // Cleanup handled by Phaser
      };
    }
  }, []);

  return (
    <div className="app" style={{ width: '100vw', height: '100vh', display: 'flex', gap: 0 }}>
      <div
        id="game-container"
        ref={gameContainer}
        className="game-container"
        style={{ flex: 1, background: '#000' }}
      />
      <div className="controls" style={{
        width: '300px',
        background: '#1a1a1a',
        borderLeft: '2px solid #0099FF',
        padding: '20px',
        overflowY: 'auto',
        fontSize: '12px',
        color: '#fff'
      }}>
        <h1 style={{ color: '#0099FF', marginBottom: '20px', fontSize: '18px' }}>Quaternion RTS</h1>
        <div className="instructions" style={{
          background: '#222',
          padding: '15px',
          borderRadius: '4px'
        }}>
          <p><strong style={{ color: '#FFD700' }}>Controls:</strong></p>
          <p>Left Click: Select Unit</p>
          <p>Right Click: Move/Attack</p>
          <p>Arrow Keys: Pan Camera</p>
          <p>B: Build Menu</p>
          <p>A: Attack Mode</p>
          <p>Space: Select All Units</p>
        </div>
      </div>
    </div>
  );
}

