/**
 * Perlin Noise Generator
 * Implementation of Perlin noise for procedural terrain generation
 * Based on Ken Perlin's improved noise algorithm
 */

export class PerlinNoise {
  private permutation: number[];
  private p: number[];

  constructor(seed: number = 0) {
    // Initialize permutation table with seed
    this.permutation = this.generatePermutation(seed);
    this.p = new Array(512);
    
    // Duplicate permutation array
    for (let i = 0; i < 256; i++) {
      this.p[256 + i] = this.p[i] = this.permutation[i];
    }
  }

  /**
   * Generate permutation table from seed
   */
  private generatePermutation(seed: number): number[] {
    const p: number[] = [];
    for (let i = 0; i < 256; i++) {
      p[i] = i;
    }
    
    // Shuffle using seed
    let state = seed;
    for (let i = 255; i > 0; i--) {
      state = (state * 1103515245 + 12345) & 0x7fffffff;
      const j = state % (i + 1);
      [p[i], p[j]] = [p[j], p[i]];
    }
    
    return p;
  }

  /**
   * Fade function for smooth interpolation
   */
  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  /**
   * Linear interpolation
   */
  private lerp(a: number, b: number, t: number): number {
    return a + t * (b - a);
  }

  /**
   * Gradient function
   */
  private grad(hash: number, x: number, y: number, z: number = 0): number {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  /**
   * 2D Perlin noise
   * Returns value between -1 and 1
   */
  public noise2D(x: number, y: number): number {
    // Find unit grid cell containing point
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;

    // Get relative x, y coordinates of point within that cell
    const fx = x - Math.floor(x);
    const fy = y - Math.floor(y);

    // Compute fade curves for each coordinate
    const u = this.fade(fx);
    const v = this.fade(fy);

    // Hash coordinates of the 4 square corners
    const A = this.p[X] + Y;
    const AA = this.p[A];
    const AB = this.p[A + 1];
    const B = this.p[X + 1] + Y;
    const BA = this.p[B];
    const BB = this.p[B + 1];

    // And add blended results from 4 corners of the square
    return this.lerp(
      this.lerp(
        this.grad(this.p[AA], fx, fy),
        this.grad(this.p[BA], fx - 1, fy),
        u
      ),
      this.lerp(
        this.grad(this.p[AB], fx, fy - 1),
        this.grad(this.p[BB], fx - 1, fy - 1),
        u
      ),
      v
    );
  }

  /**
   * 3D Perlin noise
   * Returns value between -1 and 1
   */
  public noise3D(x: number, y: number, z: number): number {
    // Find unit grid cell containing point
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const Z = Math.floor(z) & 255;

    // Get relative x, y, z coordinates of point within that cell
    const fx = x - Math.floor(x);
    const fy = y - Math.floor(y);
    const fz = z - Math.floor(z);

    // Compute fade curves for each coordinate
    const u = this.fade(fx);
    const v = this.fade(fy);
    const w = this.fade(fz);

    // Hash coordinates of the 8 cube corners
    const A = this.p[X] + Y;
    const AA = this.p[A] + Z;
    const AB = this.p[A + 1] + Z;
    const B = this.p[X + 1] + Y;
    const BA = this.p[B] + Z;
    const BB = this.p[B + 1] + Z;

    // And add blended results from 8 corners of the cube
    return this.lerp(
      this.lerp(
        this.lerp(
          this.grad(this.p[AA], fx, fy, fz),
          this.grad(this.p[BA], fx - 1, fy, fz),
          u
        ),
        this.lerp(
          this.grad(this.p[AB], fx, fy - 1, fz),
          this.grad(this.p[BB], fx - 1, fy - 1, fz),
          u
        ),
        v
      ),
      this.lerp(
        this.lerp(
          this.grad(this.p[AA + 1], fx, fy, fz - 1),
          this.grad(this.p[BA + 1], fx - 1, fy, fz - 1),
          u
        ),
        this.lerp(
          this.grad(this.p[AB + 1], fx, fy - 1, fz - 1),
          this.grad(this.p[BB + 1], fx - 1, fy - 1, fz - 1),
          u
        ),
        v
      ),
      w
    );
  }

  /**
   * Fractal Brownian Motion (FBM) - multiple octaves of noise
   * Creates more natural-looking terrain
   */
  public fbm2D(
    x: number,
    y: number,
    octaves: number = 4,
    persistence: number = 0.5,
    lacunarity: number = 2.0,
    scale: number = 1.0
  ): number {
    let value = 0;
    let amplitude = 1;
    let frequency = scale;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
      value += this.noise2D(x * frequency, y * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= lacunarity;
    }

    return value / maxValue;
  }

  /**
   * Ridge noise - creates sharp mountain ridges
   */
  public ridge2D(
    x: number,
    y: number,
    octaves: number = 4,
    persistence: number = 0.5,
    lacunarity: number = 2.0,
    scale: number = 1.0
  ): number {
    let value = 0;
    let amplitude = 1;
    let frequency = scale;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
      let n = this.noise2D(x * frequency, y * frequency);
      n = 1 - Math.abs(n); // Create ridge effect
      n = n * n; // Square to sharpen ridges
      value += n * amplitude;
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= lacunarity;
    }

    return value / maxValue;
  }

  /**
   * Domain warping - creates more natural, flowing patterns
   */
  public domainWarp2D(
    x: number,
    y: number,
    strength: number = 50.0,
    octaves: number = 4
  ): { x: number; y: number } {
    const warpX = this.fbm2D(x, y, octaves, 0.5, 2.0, 0.01) * strength;
    const warpY = this.fbm2D(x + 100, y + 100, octaves, 0.5, 2.0, 0.01) * strength;
    
    return {
      x: x + warpX,
      y: y + warpY
    };
  }
}


