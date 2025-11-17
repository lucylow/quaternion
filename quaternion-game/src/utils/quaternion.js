/**
 * Quaternion class for 3D rotations and procedural generation
 */
export class Quaternion {
  constructor(w = 1, x = 0, y = 0, z = 0) {
    this.w = w;
    this.x = x;
    this.y = y;
    this.z = z;
  }

  static fromAxisAngle(axis, angle) {
    const halfAngle = angle / 2;
    const s = Math.sin(halfAngle);
    return new Quaternion(
      Math.cos(halfAngle),
      axis.x * s,
      axis.y * s,
      axis.z * s
    );
  }

  multiply(q) {
    return new Quaternion(
      this.w * q.w - this.x * q.x - this.y * q.y - this.z * q.z,
      this.w * q.x + this.x * q.w + this.y * q.z - this.z * q.y,
      this.w * q.y - this.x * q.z + this.y * q.w + this.z * q.x,
      this.w * q.z + this.x * q.y - this.y * q.x + this.z * q.w
    );
  }

  normalize() {
    const mag = Math.sqrt(this.w * this.w + this.x * this.x + this.y * this.y + this.z * this.z);
    return new Quaternion(this.w / mag, this.x / mag, this.y / mag, this.z / mag);
  }

  toEuler() {
    // Convert to Euler angles for terrain generation
    const sinr_cosp = 2 * (this.w * this.x + this.y * this.z);
    const cosr_cosp = 1 - 2 * (this.x * this.x + this.y * this.y);
    const roll = Math.atan2(sinr_cosp, cosr_cosp);

    const sinp = 2 * (this.w * this.y - this.z * this.x);
    const pitch = Math.abs(sinp) >= 1 ? Math.sign(sinp) * Math.PI / 2 : Math.asin(sinp);

    const siny_cosp = 2 * (this.w * this.z + this.x * this.y);
    const cosy_cosp = 1 - 2 * (this.y * this.y + this.z * this.z);
    const yaw = Math.atan2(siny_cosp, cosy_cosp);

    return { roll, pitch, yaw };
  }

  /**
   * Generate a pseudo-random value based on quaternion state
   * Used for procedural generation
   */
  toHash() {
    const combined = this.w * 1000 + this.x * 100 + this.y * 10 + this.z;
    return Math.abs(Math.sin(combined) * 10000) % 1;
  }
}

/**
 * Seeded random number generator using quaternions
 */
export class QuaternionRNG {
  constructor(seed = 12345) {
    this.seed = seed;
    this.q = new Quaternion(seed % 100, (seed * 7) % 100, (seed * 13) % 100, (seed * 19) % 100).normalize();
  }

  next() {
    // Rotate quaternion to get next random value
    const rotation = Quaternion.fromAxisAngle({ x: 1, y: 1, z: 1 }, 0.1);
    this.q = this.q.multiply(rotation).normalize();
    return this.q.toHash();
  }

  nextInt(min, max) {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  nextFloat(min, max) {
    return this.next() * (max - min) + min;
  }
}
