/**
 * Simple Game Page
 * A simplified, fully playable RTS game implementation
 */

import { useEffect, useRef, useState } from 'react';
import { initSimpleGame, destroySimpleGame } from '../frontend/simpleGameConfig';

export default function SimpleGame() {
  const gameContainer = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'init' | 'loading' | 'ready' | 'error'>('init');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('[QUAT DEBUG] SimpleGame mounted, container ref:', !!gameContainer.current);
    
    if (!gameContainer.current) {
      console.error('[QUAT DEBUG] gameContainer ref is null');
      setStatus('error');
      setError('Game container not found');
      return;
    }

    const container = gameContainer.current;
    console.log('[QUAT DEBUG] Container element:', container);
    console.log('[QUAT DEBUG] Container dimensions:', {
      width: container.clientWidth,
      height: container.clientHeight,
      offsetWidth: container.offsetWidth,
      offsetHeight: container.offsetHeight
    });

    // Ensure container has dimensions
    if (container.clientWidth === 0 || container.clientHeight === 0) {
      console.warn('[QUAT DEBUG] Container has zero dimensions, waiting for layout...');
      // Wait a frame for layout
      requestAnimationFrame(() => {
        if (container.clientWidth === 0 || container.clientHeight === 0) {
          console.error('[QUAT DEBUG] Container still has zero dimensions after layout');
          setStatus('error');
          setError('Game container has no dimensions');
          return;
        }
        initializeGame();
      });
    } else {
      initializeGame();
    }

    function initializeGame() {
      try {
        console.log('[QUAT DEBUG] Initializing Phaser game...');
        setStatus('loading');
        
        // Verify container is in DOM
        if (!document.getElementById('game-container')) {
          console.error('[QUAT DEBUG] game-container not found in DOM');
          setStatus('error');
          setError('Game container not in DOM');
          return;
        }

        // Small delay to ensure DOM is ready
        setTimeout(() => {
          try {
            const game = initSimpleGame();
            console.log('[QUAT DEBUG] Phaser game initialized:', !!game);
            console.log('[QUAT DEBUG] Phaser canvas:', game?.canvas);
            
            // Check if canvas was created
            const canvas = container.querySelector('canvas');
            if (canvas) {
              console.log('[QUAT DEBUG] Canvas found:', {
                width: canvas.width,
                height: canvas.height,
                style: canvas.style.cssText,
                zIndex: window.getComputedStyle(canvas).zIndex
              });
              setStatus('ready');
            } else {
              console.warn('[QUAT DEBUG] Canvas not found after initialization');
              // Wait a bit more for Phaser to create canvas
              setTimeout(() => {
                const canvas2 = container.querySelector('canvas');
                if (canvas2) {
                  console.log('[QUAT DEBUG] Canvas found on retry');
                  setStatus('ready');
                } else {
                  console.error('[QUAT DEBUG] Canvas still not found');
                  setStatus('error');
                  setError('Phaser canvas was not created');
                }
              }, 500);
            }
          } catch (err) {
            console.error('[QUAT DEBUG] Error initializing game:', err);
            setStatus('error');
            setError(err instanceof Error ? err.message : 'Unknown error');
          }
        }, 100);
      } catch (err) {
        console.error('[QUAT DEBUG] Error in initializeGame:', err);
        setStatus('error');
        setError(err instanceof Error ? err.message : 'Unknown error');
      }
    }

    return () => {
      console.log('[QUAT DEBUG] SimpleGame unmounting, destroying game');
      destroySimpleGame();
    };
  }, []);

  return (
    <div className="app" style={{ width: '100vw', height: '100vh', display: 'flex', gap: 0, position: 'relative' }}>
      <div
        id="game-container"
        ref={gameContainer}
        className="game-container"
        style={{ 
          flex: 1, 
          background: '#222222',
          position: 'relative',
          minWidth: 0,
          minHeight: 0,
          overflow: 'hidden'
        }}
      >
        {/* Debug overlay */}
        {window.__QUAT_DEBUG__ && (
          <div style={{
            position: 'absolute',
            top: 10,
            left: 10,
            zIndex: 10000,
            background: 'rgba(0,0,0,0.8)',
            color: '#fff',
            padding: '8px',
            fontSize: '12px',
            fontFamily: 'monospace',
            borderRadius: '4px',
            pointerEvents: 'none'
          }}>
            <div>Status: {status}</div>
            {error && <div style={{ color: '#ff0000' }}>Error: {error}</div>}
            <div>Container: {gameContainer.current ? `${gameContainer.current.clientWidth}x${gameContainer.current.clientHeight}` : 'null'}</div>
            <div>Canvas: {gameContainer.current?.querySelector('canvas') ? 'found' : 'not found'}</div>
          </div>
        )}
      </div>
      <div className="controls" style={{
        width: '300px',
        background: '#1a1a1a',
        borderLeft: '2px solid #0099FF',
        padding: '20px',
        overflowY: 'auto',
        fontSize: '12px',
        color: '#fff',
        zIndex: 100
      }}>
        <h1 style={{ color: '#0099FF', marginBottom: '20px', fontSize: '18px' }}>Quaternion RTS</h1>
        {status === 'error' && (
          <div style={{ 
            background: 'rgba(255,0,0,0.2)', 
            padding: '10px', 
            marginBottom: '10px',
            borderRadius: '4px',
            border: '1px solid #ff0000'
          }}>
            <strong style={{ color: '#ff0000' }}>Error:</strong> {error}
          </div>
        )}
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

