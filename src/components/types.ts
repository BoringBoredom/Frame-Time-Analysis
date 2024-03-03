export interface Bench {
  name: string;
  uploaded: string;
  color: string;
  duration: number;
  frames: number;
  dropped?: number;
  allowsTearing?: number;
  dwmNotified?: number;
  wasBatched?: number;
  applications?: string;
  runtimes?: string;
  presentModes?: string;
  syncIntervals?: string;
  ms: Ms;
  fps: Fps;
}

export interface Ms {
  unsorted: number[];
  sorted: number[];
  chartFormat: { x: number; y: number }[];
}

export interface Fps {
  metrics: {
    min: number;
    avg: number;
    max: number;
    stdev: number;
    percentiles: Record<number, number>;
    lows: Record<number, number>;
  };
  unsorted: number[];
  chartFormat: { x: number; y: number }[];
}

export interface Extremes {
  duration: { min: 0; max: number };
  fps: { min: number; max: number };
  ms: { min: number; max: number };
}

export interface Data {
  benches: Bench[];
  extremes: Extremes;
}

export interface Cfx {
  Info: {
    ProcessName: string;
    ApiInfo: string;
    PresentationMode: string;
  };
  Runs: {
    PresentMonRuntime: string;
    CaptureData: {
      MsBetweenPresents: number[];
      PresentMode?: number[];
      AllowsTearing?: number[];
      SyncInterval?: number[];
      Dropped?: boolean[];
    };
  }[];
}
