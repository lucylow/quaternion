/**
 * Monster Renderer
 * Procedurally renders monsters based on type and seed
 * Phaser-compatible rendering system
 */

import { Monster } from '../engine/entities/Monster';
import Phaser from 'phaser';

export class MonsterRenderer {
  private scene: Phaser.Scene;
  private spriteCache: Map<number, Phaser.GameObjects.Graphics> = new Map();
  private monsterSprites: Map<string, Phaser.GameObjects.Container> = new Map();
  private healthBarGraphics: Map<string, Phaser.GameObjects.Graphics> = new Map();
  private spriteSize: number = 64;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Render a monster
   */
  public render(monster: Monster): void {
    // Get or create sprite container
    let container = this.monsterSprites.get(monster.id);
    if (!container) {
      container = this.createMonsterSprite(monster);
      this.monsterSprites.set(monster.id, container);
    }

    // Update sprite position
    container.setPosition(monster.position.x, monster.position.y);
    container.setDepth(100); // Render above terrain

    // Update health bar
    this.updateHealthBar(monster);

    // Update animation state visual
    this.updateAnimationState(monster, container);
  }

  /**
   * Create monster sprite container
   */
  private createMonsterSprite(monster: Monster): Phaser.GameObjects.Container {
    const container = this.scene.add.container(monster.position.x, monster.position.y);
    
    // Get or generate sprite
    const sprite = this.getOrGenerateSprite(monster);
    container.add(sprite);
    
    // Add health bar
    const healthBar = this.createHealthBar(monster);
    container.add(healthBar);
    
    // Scale based on monster visual params
    container.setScale(monster.visualParams.scaleMultiplier);
    
    return container;
  }

  /**
   * Get or generate sprite for monster
   */
  private getOrGenerateSprite(monster: Monster): Phaser.GameObjects.Graphics {
    // Check cache
    if (this.spriteCache.has(monster.modelSeed)) {
      const cached = this.spriteCache.get(monster.modelSeed)!;
      return this.scene.add.graphics().copy(cached);
    }

    // Generate new sprite
    const graphics = this.scene.add.graphics();
    this.generateMonsterSprite(graphics, monster);
    
    // Cache it
    this.spriteCache.set(monster.modelSeed, graphics);
    
    return graphics;
  }

  /**
   * Generate monster sprite procedurally
   */
  private generateMonsterSprite(graphics: Phaser.GameObjects.Graphics, monster: Monster): void {
    const colors = monster.visualParams.colorScheme;
    const size = this.spriteSize;
    const centerX = size / 2;
    const centerY = size / 2;

    switch (monster.monsterType) {
      case 'spider':
        this.drawSpider(graphics, centerX, centerY, colors, size);
        break;
      case 'goblin':
        this.drawGoblin(graphics, centerX, centerY, colors, size);
        break;
      case 'undead':
        this.drawUndead(graphics, centerX, centerY, colors, size);
        break;
      case 'dragon':
        this.drawDragon(graphics, centerX, centerY, colors, size);
        break;
    }
  }

  /**
   * Draw spider sprite
   */
  private drawSpider(
    graphics: Phaser.GameObjects.Graphics,
    centerX: number,
    centerY: number,
    colors: any,
    size: number
  ): void {
    const bodySize = size * 0.3;
    
    // Body (oval)
    graphics.fillStyle(Phaser.Display.Color.HexStringToColor(colors.primary).color);
    graphics.fillEllipse(centerX, centerY, bodySize, bodySize * 0.7);
    
    // Legs (8 legs)
    graphics.lineStyle(3, Phaser.Display.Color.HexStringToColor(colors.secondary).color);
    const legLength = size * 0.25;
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const startX = centerX + Math.cos(angle) * (bodySize / 2);
      const startY = centerY + Math.sin(angle) * (bodySize / 2);
      const endX = startX + Math.cos(angle) * legLength;
      const endY = startY + Math.sin(angle) * legLength;
      graphics.lineBetween(startX, startY, endX, endY);
    }
    
    // Eyes
    graphics.fillStyle(Phaser.Display.Color.HexStringToColor('#000000').color);
    graphics.fillCircle(centerX - bodySize * 0.2, centerY - bodySize * 0.1, 2);
    graphics.fillCircle(centerX + bodySize * 0.2, centerY - bodySize * 0.1, 2);
  }

  /**
   * Draw goblin sprite
   */
  private drawGoblin(
    graphics: Phaser.GameObjects.Graphics,
    centerX: number,
    centerY: number,
    colors: any,
    size: number
  ): void {
    const bodyHeight = size * 0.6;
    const bodyWidth = size * 0.4;
    
    // Body (rectangular)
    graphics.fillStyle(Phaser.Display.Color.HexStringToColor(colors.primary).color);
    graphics.fillRect(centerX - bodyWidth / 2, centerY - bodyHeight / 2, bodyWidth, bodyHeight);
    
    // Head (circle)
    const headSize = size * 0.25;
    graphics.fillStyle(Phaser.Display.Color.HexStringToColor(colors.secondary).color);
    graphics.fillCircle(centerX, centerY - bodyHeight / 2 - headSize / 2, headSize);
    
    // Eyes (yellow)
    graphics.fillStyle(Phaser.Display.Color.HexStringToColor('#FFD700').color);
    graphics.fillCircle(centerX - headSize * 0.2, centerY - bodyHeight / 2 - headSize / 2, 3);
    graphics.fillCircle(centerX + headSize * 0.2, centerY - bodyHeight / 2 - headSize / 2, 3);
    
    // Arms
    graphics.lineStyle(4, Phaser.Display.Color.HexStringToColor(colors.primary).color);
    graphics.lineBetween(centerX - bodyWidth / 2, centerY, centerX - bodyWidth, centerY + bodyHeight * 0.2);
    graphics.lineBetween(centerX + bodyWidth / 2, centerY, centerX + bodyWidth, centerY + bodyHeight * 0.2);
    
    // Legs
    graphics.lineStyle(4, Phaser.Display.Color.HexStringToColor(colors.primary).color);
    graphics.lineBetween(centerX - bodyWidth * 0.2, centerY + bodyHeight / 2, centerX - bodyWidth * 0.2, centerY + bodyHeight);
    graphics.lineBetween(centerX + bodyWidth * 0.2, centerY + bodyHeight / 2, centerX + bodyWidth * 0.2, centerY + bodyHeight);
  }

  /**
   * Draw undead sprite
   */
  private drawUndead(
    graphics: Phaser.GameObjects.Graphics,
    centerX: number,
    centerY: number,
    colors: any,
    size: number
  ): void {
    const bodyHeight = size * 0.7;
    const bodyWidth = size * 0.35;
    
    // Body (dark gray)
    graphics.fillStyle(Phaser.Display.Color.HexStringToColor(colors.primary).color);
    graphics.fillRect(centerX - bodyWidth / 2, centerY - bodyHeight / 2, bodyWidth, bodyHeight);
    
    // Skull head
    const headSize = size * 0.3;
    graphics.fillStyle(Phaser.Display.Color.HexStringToColor(colors.secondary).color);
    graphics.fillCircle(centerX, centerY - bodyHeight / 2 - headSize / 2, headSize);
    
    // Skull marks (dark)
    graphics.fillStyle(Phaser.Display.Color.HexStringToColor('#000000').color);
    // Eye sockets
    graphics.fillCircle(centerX - headSize * 0.25, centerY - bodyHeight / 2 - headSize / 2, 4);
    graphics.fillCircle(centerX + headSize * 0.25, centerY - bodyHeight / 2 - headSize / 2, 4);
    // Mouth
    graphics.fillRect(centerX - headSize * 0.2, centerY - bodyHeight / 2 - headSize / 2 + headSize * 0.2, headSize * 0.4, 3);
    
    // Tattered cloth
    graphics.lineStyle(2, Phaser.Display.Color.HexStringToColor(colors.accent).color);
    graphics.lineBetween(centerX - bodyWidth / 2, centerY, centerX - bodyWidth, centerY + bodyHeight * 0.3);
    graphics.lineBetween(centerX + bodyWidth / 2, centerY, centerX + bodyWidth, centerY + bodyHeight * 0.3);
  }

  /**
   * Draw dragon sprite
   */
  private drawDragon(
    graphics: Phaser.GameObjects.Graphics,
    centerX: number,
    centerY: number,
    colors: any,
    size: number
  ): void {
    const bodySize = size * 0.5;
    
    // Large body (oval)
    graphics.fillStyle(Phaser.Display.Color.HexStringToColor(colors.primary).color);
    graphics.fillEllipse(centerX, centerY, bodySize, bodySize * 0.8);
    
    // Wings
    graphics.fillStyle(Phaser.Display.Color.HexStringToColor(colors.secondary).color);
    const wingSize = size * 0.4;
    // Left wing
    graphics.fillTriangle(
      centerX - bodySize / 2, centerY,
      centerX - bodySize, centerY - wingSize,
      centerX - bodySize * 0.7, centerY + wingSize * 0.3
    );
    // Right wing
    graphics.fillTriangle(
      centerX + bodySize / 2, centerY,
      centerX + bodySize, centerY - wingSize,
      centerX + bodySize * 0.7, centerY + wingSize * 0.3
    );
    
    // Head
    const headSize = size * 0.25;
    graphics.fillStyle(Phaser.Display.Color.HexStringToColor(colors.primary).color);
    graphics.fillCircle(centerX, centerY - bodySize / 2 - headSize / 2, headSize);
    
    // Eyes (glowing)
    graphics.fillStyle(Phaser.Display.Color.HexStringToColor(colors.accent).color);
    graphics.fillCircle(centerX - headSize * 0.2, centerY - bodySize / 2 - headSize / 2, 4);
    graphics.fillCircle(centerX + headSize * 0.2, centerY - bodySize / 2 - headSize / 2, 4);
    
    // Tail
    graphics.lineStyle(6, Phaser.Display.Color.HexStringToColor(colors.primary).color);
    graphics.lineBetween(centerX, centerY + bodySize / 2, centerX + bodySize * 0.3, centerY + bodySize);
  }

  /**
   * Create health bar
   */
  private createHealthBar(monster: Monster): Phaser.GameObjects.Graphics {
    const healthBar = this.scene.add.graphics();
    this.healthBarGraphics.set(monster.id, healthBar);
    this.updateHealthBar(monster);
    return healthBar;
  }

  /**
   * Update health bar
   */
  private updateHealthBar(monster: Monster): void {
    const healthBar = this.healthBarGraphics.get(monster.id);
    if (!healthBar) return;

    healthBar.clear();
    
    const barWidth = this.spriteSize * 0.8;
    const barHeight = 6;
    const barX = -barWidth / 2;
    const barY = -this.spriteSize / 2 - 10;
    
    const healthPercent = monster.getHealthPercent();
    
    // Background (red)
    healthBar.fillStyle(Phaser.Display.Color.HexStringToColor('#FF0000').color);
    healthBar.fillRect(barX, barY, barWidth, barHeight);
    
    // Health (green to red gradient)
    const green = Math.floor(healthPercent * 255);
    const red = Math.floor((1 - healthPercent) * 255);
    const color = Phaser.Display.Color.GetColor(red, green, 0);
    healthBar.fillStyle(color);
    healthBar.fillRect(barX, barY, barWidth * healthPercent, barHeight);
    
    // Border
    healthBar.lineStyle(1, Phaser.Display.Color.HexStringToColor('#FFFFFF').color);
    healthBar.strokeRect(barX, barY, barWidth, barHeight);
  }

  /**
   * Update animation state visual effects
   */
  private updateAnimationState(monster: Monster, container: Phaser.GameObjects.Container): void {
    // Add visual effects based on animation state
    switch (monster.animationState) {
      case 'attacking':
        // Add attack glow effect
        container.setTint(Phaser.Display.Color.GetColor(255, 200, 200));
        break;
      case 'fleeing':
        // Add fleeing effect (slight transparency)
        container.setAlpha(0.8);
        break;
      case 'moving':
        // Normal appearance
        container.setTint(0xFFFFFF);
        container.setAlpha(1.0);
        break;
      case 'idle':
      default:
        container.setTint(0xFFFFFF);
        container.setAlpha(1.0);
        break;
    }
  }

  /**
   * Remove monster sprite
   */
  public removeMonster(monsterId: string): void {
    const container = this.monsterSprites.get(monsterId);
    if (container) {
      container.destroy();
      this.monsterSprites.delete(monsterId);
    }
    
    const healthBar = this.healthBarGraphics.get(monsterId);
    if (healthBar) {
      healthBar.destroy();
      this.healthBarGraphics.delete(monsterId);
    }
  }

  /**
   * Clear all sprites
   */
  public clearAll(): void {
    this.monsterSprites.forEach(container => container.destroy());
    this.healthBarGraphics.forEach(graphics => graphics.destroy());
    this.monsterSprites.clear();
    this.healthBarGraphics.clear();
  }
}

