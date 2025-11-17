/**
 * Seeded pseudorandom number generator (Mulberry32)
 * Ensures deterministic behavior for replay system
 */
export class SeededRandom {
  private seed: number;
  private state: number;

  constructor(seed: number) {
    this.seed = seed;
    this.state = seed;
  }

  /**
   * Generate next random number between 0 and 1
   */
  public next(): number {
    let t = this.state += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }

  /**
   * Generate random integer between min and max (inclusive)
   */
  public nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /**
   * Generate random float between min and max
   */
  public nextFloat(min: number, max: number): number {
    return this.next() * (max - min) + min;
  }

  /**
   * Choose random element from array
   */
  public choice<T>(array: T[]): T {
    return array[this.nextInt(0, array.length - 1)];
  }

  /**
   * Shuffle array in place
   */
  public shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i);
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  /**
   * Reset to initial seed
   */
  public reset(): void {
    this.state = this.seed;
  }

  /**
   * Get current seed
   */
  public getSeed(): number {
    return this.seed;
  }
}
