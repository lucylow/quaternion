// Global window type extensions for debug and logging

interface Window {
  __QUAT_DEBUG__?: boolean;
  __QUAT_LOGS__?: Array<{
    level: 'error' | 'warn' | 'info' | string;
    args: any[];
    ts: number;
  }>;
  __QUAT_FORCE_LOAD_SAMPLE__?: boolean;
  __QUAT_SAMPLE_REPLAY__?: any;
  __QUAT_DEV_SAMPLE__?: any;
  __QUAT_DEV_FALLBACK_RENDER__?: () => void;
  __QUAT_PHASER_GAME__?: any;
  __QUAT_CANVAS__?: HTMLCanvasElement;
  __QUAT_CTX__?: CanvasRenderingContext2D;
  initQuaternionEngine?: (canvas: HTMLCanvasElement) => Promise<void>;
  quaternionEngine?: any;
  useReplay?: {
    loadReplay?: (replay: any) => void;
  };
  renderFrame?: (canvas: HTMLElement) => void;
}

