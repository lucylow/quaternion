// EngineBridge.ts
// Bridge for React UI to communicate with Phaser game engine

type Command = { type: string; payload?: any };

class EngineBridge {
  private listeners: ((cmd: Command) => void)[] = [];

  sendCommand(cmd: Command) {
    // broadcast to listeners (Phaser scene registers)
    this.listeners.forEach((l) => {
      try { 
        l(cmd); 
      } catch (e) { 
        console.error('EngineBridge: listener failed', e); 
      }
    });
  }

  onCommand(fn: (cmd: Command) => void) {
    this.listeners.push(fn);
    return () => { 
      this.listeners = this.listeners.filter(x => x !== fn); 
    };
  }

  // Clear all listeners (useful for cleanup)
  clear() {
    this.listeners = [];
  }
}

export const engineBridge = new EngineBridge();

// Attach to window for debugging (optional)
if (typeof window !== 'undefined' && (window as any).__QUAT_DEBUG__) {
  (window as any).engineBridge = engineBridge;
}

