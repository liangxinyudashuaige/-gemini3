export interface HandInteractionState {
  leftHand: {
    present: boolean;
    x: number; // Normalized 0-1
    y: number; // Normalized 0-1
    pinching: boolean;
    pinchDistance: number;
  };
  rightHand: {
    present: boolean;
    x: number; // Normalized 0-1
    y: number; // Normalized 0-1
    pinching: boolean;
    screenX: number; // Pixel value
    screenY: number; // Pixel value
  };
}

export type EarthRegion = '美洲' | '欧洲/非洲' | '亚洲' | '太平洋' | '大西洋' | '扫描中...';

// Shared mutable ref type to avoid React render cycles for high-freq updates
export interface InteractionRef {
  current: HandInteractionState;
}