export class Quaternion {
  w: number;
  x: number;
  y: number;
  z: number;

  constructor(w = 1, x = 0, y = 0, z = 0) {
    this.w = w;
    this.x = x;
    this.y = y;
    this.z = z;
  }

  static multiply(q1: Quaternion, q2: Quaternion): Quaternion {
    return new Quaternion(
      q1.w * q2.w - q1.x * q2.x - q1.y * q2.y - q1.z * q2.z,
      q1.w * q2.x + q1.x * q2.w + q1.y * q2.z - q1.z * q2.y,
      q1.w * q2.y - q1.x * q2.z + q1.y * q2.w + q1.z * q2.x,
      q1.w * q2.z + q1.x * q2.y - q1.y * q2.x + q1.z * q2.w
    );
  }

  static lerp(q1: Quaternion, q2: Quaternion, t: number): Quaternion {
    const dot = q1.w * q2.w + q1.x * q2.x + q1.y * q2.y + q1.z * q2.z;
    const q2adj = dot < 0 ? new Quaternion(-q2.w, -q2.x, -q2.y, -q2.z) : q2;

    return new Quaternion(
      q1.w + (q2adj.w - q1.w) * t,
      q1.x + (q2adj.x - q1.x) * t,
      q1.y + (q2adj.y - q1.y) * t,
      q1.z + (q2adj.z - q1.z) * t
    );
  }

  magnitude(): number {
    return Math.sqrt(this.w * this.w + this.x * this.x + this.y * this.y + this.z * this.z);
  }

  normalize(): Quaternion {
    const mag = this.magnitude();
    return new Quaternion(this.w / mag, this.x / mag, this.y / mag, this.z / mag);
  }
}

export class QuaternionPerlinNoise {
  seed: number;
  permutation: number[];

  constructor(seed = 0) {
    this.seed = seed;
    this.permutation = this.buildPermutation(seed);
  }

  buildPermutation(seed: number): number[] {
    const p: number[] = [];
    for (let i = 0; i < 256; i++) {
      p[i] = i;
    }

    // Fisher-Yates shuffle with seed
    let currentSeed = seed;
    for (let i = 255; i > 0; i--) {
      currentSeed = (currentSeed * 16807) % 2147483647;
      const j = Math.floor((Math.abs(currentSeed) % (i + 1)));
      [p[i], p[j]] = [p[j], p[i]];
    }

    return p.concat(p);
  }

  fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  lerp(t: number, a: number, b: number): number {
    return a + t * (b - a);
  }

  perlin3D(x: number, y: number, z: number): number {
    const xi = Math.floor(x) & 255;
    const yi = Math.floor(y) & 255;
    const zi = Math.floor(z) & 255;

    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);
    const zf = z - Math.floor(z);

    const u = this.fade(xf);
    const v = this.fade(yf);
    const w = this.fade(zf);

    const p = this.permutation;
    const aa = p[p[xi] + yi] + zi;
    const ba = p[p[xi + 1] + yi] + zi;
    const ab = p[p[xi] + yi + 1] + zi;
    const bb = p[p[xi + 1] + yi + 1] + zi;

    const g = (hash: number): number => {
      const h = hash & 15;
      const r = 1 + (h & 7);
      return ((h & 8) === 0 ? 1 : -1) * r * 0.5;
    };

    const ga = g(p[aa]);
    const gb = g(p[ba]);
    const gc = g(p[ab]);
    const gd = g(p[bb]);
    const ge = g(p[aa + 1]);
    const gf = g(p[ba + 1]);
    const gg = g(p[ab + 1]);
    const gh = g(p[bb + 1]);

    const x1 = this.lerp(u, ga * xf, gb * (xf - 1));
    const x2 = this.lerp(u, gc * xf, gd * (xf - 1));
    const y1 = this.lerp(v, x1, x2);

    const x3 = this.lerp(u, ge * xf, gf * (xf - 1));
    const x4 = this.lerp(u, gg * xf, gh * (xf - 1));
    const y2 = this.lerp(v, x3, x4);

    return (this.lerp(w, y1, y2) + 1) / 2;
  }

  perlin2D(x: number, y: number): number {
    return this.perlin3D(x, y, 0);
  }

  octavePerlin(x: number, y: number, octaves = 4, persistence = 0.5, lacunarity = 2): number {
    let value = 0;
    let amplitude = 1;
    let frequency = 1;
    let maxValue = 0;

    for (let i = 0; i < octaves; i++) {
      value += amplitude * this.perlin2D(x * frequency, y * frequency);
      maxValue += amplitude;
      amplitude *= persistence;
      frequency *= lacunarity;
    }

    return value / maxValue;
  }
}


