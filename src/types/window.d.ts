// Global window type extensions for debug and logging

interface Window {
  __QUAT_DEBUG__?: boolean;
  __QUAT_LOGS__?: Array<{
    level: 'error' | 'warn' | 'info';
    args: string[];
    ts: number;
  }>;
  __QUAT_FORCE_LOAD_SAMPLE__?: boolean;
  __QUAT_SAMPLE_REPLAY__?: any;
  initQuaternionEngine?: (canvas: HTMLCanvasElement) => Promise<void>;
  quaternionEngine?: any;
  useReplay?: {
    loadReplay?: (replay: any) => void;
  };
}

