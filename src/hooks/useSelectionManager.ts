import { useRef, useState } from 'react';
import Phaser from 'phaser';
import { InteractivityManager } from '@/game/InteractivityManager';
import { InteractionAudio } from '@/audio/InteractionAudio';

interface ControlGroup {
  id: number;
  units: Phaser.Physics.Arcade.Sprite[];
}

export const useSelectionManager = () => {
  const [selectedUnits, setSelectedUnits] = useState<Phaser.Physics.Arcade.Sprite[]>([]);
  const controlGroupsRef = useRef<Map<number, ControlGroup>>(new Map());
  const selectionGraphicsRef = useRef<Phaser.GameObjects.Graphics | null>(null);
  const isSelectingRef = useRef(false);
  const selectionStartRef = useRef({ x: 0, y: 0 });
  const interactivityManagerRef = useRef<InteractivityManager | null>(null);
  const interactionAudioRef = useRef<InteractionAudio | null>(null);

  const setupSelection = async (
    scene: Phaser.Scene,
    playerUnits: Phaser.Physics.Arcade.Sprite[],
    onSelectionChange?: (units: Phaser.Physics.Arcade.Sprite[]) => void
  ) => {
    // Initialize interactivity manager
    if (!interactivityManagerRef.current) {
      interactivityManagerRef.current = new InteractivityManager(scene, {
        enableHoverEffects: true,
        enableClickAnimations: true,
        enableSelectionPulse: true,
        enableHapticFeedback: true
      });
    }

    // Initialize interaction audio
    if (!interactionAudioRef.current) {
      interactionAudioRef.current = InteractionAudio.instance();
      await interactionAudioRef.current.init();
    }

    // Create selection graphics
    const selectionGraphics = scene.add.graphics();
    selectionGraphicsRef.current = selectionGraphics;

    let isSelecting = false;
    const selectionStart = { x: 0, y: 0 };
    const selected: Phaser.Physics.Arcade.Sprite[] = [];

    // Make all player units interactive with enhanced feedback
    playerUnits.forEach(unit => {
      if (interactivityManagerRef.current) {
        interactivityManagerRef.current.makeInteractive(unit, {
          onHover: () => {
            interactionAudioRef.current?.play('hover', { volume: 0.3 });
          },
          onClick: () => {
            interactionAudioRef.current?.play('click', { volume: 0.5 });
          },
          onSelect: () => {
            interactionAudioRef.current?.play('select', { volume: 0.6 });
          },
          hoverScale: 1.15,
          selectionColor: 0x00ffea
        });
      }
    });

    // Left click - start selection
    scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.leftButtonDown()) {
        // Check if clicking on UI (would need UI bounds check)
        const worldX = pointer.worldX;
        const worldY = pointer.worldY;

        // Check for single unit click
        let unitClicked = false;
        playerUnits.forEach(unit => {
          if (!unit.active) return;
          const dist = Phaser.Math.Distance.Between(unit.x, unit.y, worldX, worldY);
          if (dist < 20) {
            if (!pointer.isDown || !pointer.shiftKey) {
              // Clear selection if not shift-clicking
              selected.forEach(u => {
                if (interactivityManagerRef.current) {
                  interactivityManagerRef.current.deselectObject(u);
                }
              });
              selected.length = 0;
            }
            selected.push(unit);
            if (interactivityManagerRef.current) {
              interactivityManagerRef.current.selectObject(unit, 0x00ffea);
            }
            interactionAudioRef.current?.play('select', { volume: 0.6 });
            unitClicked = true;
          }
        });

        if (!unitClicked) {
          isSelecting = true;
          selectionStart.x = worldX;
          selectionStart.y = worldY;
          scene.events.emit('selection-start');
        }
      }
    });

    // Update selection box
    scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (isSelecting) {
        selectionGraphics.clear();
        selectionGraphics.lineStyle(2, 0x00ffea, 0.8);
        selectionGraphics.fillStyle(0x00ffea, 0.1);
        
        const width = pointer.worldX - selectionStart.x;
        const height = pointer.worldY - selectionStart.y;
        
        selectionGraphics.fillRect(selectionStart.x, selectionStart.y, width, height);
        selectionGraphics.strokeRect(selectionStart.x, selectionStart.y, width, height);
      }
    });

    // End selection
    scene.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (pointer.leftButtonReleased() && isSelecting) {
        isSelecting = false;
        selectionGraphics.clear();
        scene.events.emit('selection-end');

        // Select units in box
        if (!pointer.shiftKey) {
          // Clear previous selection
          selected.forEach(u => {
            if (interactivityManagerRef.current) {
              interactivityManagerRef.current.deselectObject(u);
            }
          });
          selected.length = 0;
        }

        // Find units in selection box
        const minX = Math.min(selectionStart.x, pointer.worldX);
        const maxX = Math.max(selectionStart.x, pointer.worldX);
        const minY = Math.min(selectionStart.y, pointer.worldY);
        const maxY = Math.max(selectionStart.y, pointer.worldY);

        let unitsSelected = 0;
        playerUnits.forEach(unit => {
          if (!unit.active) return;
          if (unit.x >= minX && unit.x <= maxX && unit.y >= minY && unit.y <= maxY) {
            if (!selected.includes(unit)) {
              selected.push(unit);
              if (interactivityManagerRef.current) {
                interactivityManagerRef.current.selectObject(unit, 0x00ffea);
              }
              unitsSelected++;
            }
          }
        });

        // Play selection sound if units were selected
        if (unitsSelected > 0) {
          interactionAudioRef.current?.play('select', { volume: 0.5 });
        }

        // Update selection state
        setSelectedUnits([...selected]);
        if (onSelectionChange) {
          onSelectionChange([...selected]);
        }
      }
    });

    // Keyboard shortcuts for control groups
    const controlGroupKeys = scene.input.keyboard?.addKeys('ONE,TWO,THREE,FOUR,FIVE,SIX,SEVEN,EIGHT,NINE') as {
      [key: string]: Phaser.Input.Keyboard.Key;
    };

    if (controlGroupKeys) {
      // Create control group (Ctrl + number)
      scene.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
        if (event.ctrlKey || event.metaKey) {
          const num = parseInt(event.key);
          if (num >= 1 && num <= 9 && selected.length > 0) {
            controlGroupsRef.current.set(num, {
              id: num,
              units: [...selected]
            });
            // Visual feedback
            console.log(`Control group ${num} created with ${selected.length} units`);
          }
        }
      });

      // Select control group (number)
      Object.keys(controlGroupKeys).forEach((key, index) => {
        const groupNum = index + 1;
        const keyObj = controlGroupKeys[key];
        keyObj.on('down', () => {
          const group = controlGroupsRef.current.get(groupNum);
          if (group && group.units.length > 0) {
            // Clear current selection
            selected.forEach(u => {
              if (interactivityManagerRef.current) {
                interactivityManagerRef.current.deselectObject(u);
              }
            });
            selected.length = 0;

            // Select group units
            group.units.forEach(unit => {
              if (unit.active) {
                selected.push(unit);
                if (interactivityManagerRef.current) {
                  interactivityManagerRef.current.selectObject(unit, 0x00ffea);
                }
              }
            });

            interactionAudioRef.current?.play('select', { volume: 0.5 });

            // Remove inactive units from group
            controlGroupsRef.current.set(groupNum, {
              id: groupNum,
              units: selected.filter(u => u.active)
            });

            setSelectedUnits([...selected]);
            if (onSelectionChange) {
              onSelectionChange([...selected]);
            }
          }
        });
      });
    }

    // Space bar - center camera on selection
    scene.input.keyboard?.on('keydown-SPACE', () => {
      if (selected.length > 0) {
        const avgX = selected.reduce((sum, u) => sum + u.x, 0) / selected.length;
        const avgY = selected.reduce((sum, u) => sum + u.y, 0) / selected.length;
        scene.cameras.main.centerOn(avgX, avgY);
      }
    });

    return {
      selectedUnits: selected,
      clearSelection: () => {
        selected.forEach(u => {
          if (interactivityManagerRef.current) {
            interactivityManagerRef.current.deselectObject(u);
          }
        });
        selected.length = 0;
        setSelectedUnits([]);
        if (onSelectionChange) {
          onSelectionChange([]);
        }
      },
      addToSelection: (unit: Phaser.Physics.Arcade.Sprite) => {
        if (!selected.includes(unit)) {
          selected.push(unit);
          if (interactivityManagerRef.current) {
            interactivityManagerRef.current.selectObject(unit, 0x00ffea);
          }
          interactionAudioRef.current?.play('select', { volume: 0.4 });
          setSelectedUnits([...selected]);
          if (onSelectionChange) {
            onSelectionChange([...selected]);
          }
        }
      },
      update: () => {
        // Update selection rings positions
        if (interactivityManagerRef.current) {
          interactivityManagerRef.current.updateSelectionRings();
        }
      }
    };
  };

  return {
    setupSelection,
    selectedUnits,
    controlGroups: controlGroupsRef.current
  };
};

