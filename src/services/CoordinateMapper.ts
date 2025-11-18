/**
 * Coordinate Mapper Service
 * Converts between pixel coordinates (canvas/image) and game grid coordinates (backend)
 */

export class CoordinateMapper {
  private imageWidth: number;
  private imageHeight: number;
  private gridWidth: number;
  private gridHeight: number;
  private scale: number;
  private offsetX: number;
  private offsetY: number;

  constructor(
    imageWidth: number,
    imageHeight: number,
    gridWidth: number,
    gridHeight: number,
    scale: number = 1,
    offsetX: number = 0,
    offsetY: number = 0
  ) {
    this.imageWidth = imageWidth;
    this.imageHeight = imageHeight;
    this.gridWidth = gridWidth;
    this.gridHeight = gridHeight;
    this.scale = scale;
    this.offsetX = offsetX;
    this.offsetY = offsetY;
  }

  /**
   * Convert game grid coordinates to canvas pixel coordinates
   */
  gridToPixel(gridX: number, gridY: number): { x: number; y: number } {
    const pixelX = (gridX / this.gridWidth) * this.imageWidth * this.scale + this.offsetX;
    const pixelY = (gridY / this.gridHeight) * this.imageHeight * this.scale + this.offsetY;
    return { x: pixelX, y: pixelY };
  }

  /**
   * Convert canvas pixel coordinates to game grid coordinates
   */
  pixelToGrid(pixelX: number, pixelY: number): { x: number; y: number } {
    const adjustedX = (pixelX - this.offsetX) / this.scale;
    const adjustedY = (pixelY - this.offsetY) / this.scale;
    const gridX = (adjustedX / this.imageWidth) * this.gridWidth;
    const gridY = (adjustedY / this.imageHeight) * this.gridHeight;
    return { 
      x: Math.floor(Math.max(0, Math.min(this.gridWidth - 1, gridX))),
      y: Math.floor(Math.max(0, Math.min(this.gridHeight - 1, gridY)))
    };
  }

  /**
   * Update scale and offset (for zoom/pan)
   */
  updateTransform(scale: number, offsetX: number, offsetY: number): void {
    this.scale = scale;
    this.offsetX = offsetX;
    this.offsetY = offsetY;
  }

  /**
   * Get tile size in pixels
   */
  getTileSize(): { width: number; height: number } {
    return {
      width: (this.imageWidth / this.gridWidth) * this.scale,
      height: (this.imageHeight / this.gridHeight) * this.scale
    };
  }
}


