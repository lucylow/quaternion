import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { gameConfig } from '../frontend/scenes/BootScene';
import '../App.css';

const MapGenerator = () => {
  const gameRef = useRef<HTMLDivElement>(null);
  const phaserGameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!gameRef.current || phaserGameRef.current) {
      return;
    }

    phaserGameRef.current = new Phaser.Game({
      ...gameConfig,
      parent: gameRef.current || undefined
    });

    return () => {
      if (phaserGameRef.current) {
        phaserGameRef.current.destroy(true);
        phaserGameRef.current = null;
      }
    };
  }, []);

  return (
    <div className="game-wrapper">
      <h1>Quaternion - Multi-Theme Map Generator</h1>
      <p>Select a map theme above to explore procedurally-generated terrain</p>
      <div id="game-container" ref={gameRef} className="game-container"></div>
      <div className="info-panel">
        <h3>Map Themes</h3>
        <ul>
          <li>
            <strong>Fire:</strong> Lava, volcanic terrain, and scorching heat
          </li>
          <li>
            <strong>Ice:</strong> Frozen tundra, glaciers, and crevasses
          </li>
          <li>
            <strong>Forest:</strong> Dense woodland with swamps and groves
          </li>
          <li>
            <strong>Desert:</strong> Sand dunes, canyons, and oasis
          </li>
          <li>
            <strong>Volcanic:</strong> Dark basalt, obsidian, and active lava
          </li>
        </ul>
      </div>
    </div>
  );
};

export default MapGenerator;

