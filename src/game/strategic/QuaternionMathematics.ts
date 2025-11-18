/**
 * Quaternion Mathematics for Decision Rotations
 * Represents decisions as quaternion rotations in 4D space
 */

import { StrategicDecision } from './DecisionTypes';
import { QuaternionState } from './QuaternionState';

/**
 * Represents a decision as a quaternion rotation Q = [w, x, y, z]
 * where w=Stability, x=Ore, y=Energy, z=Biomass, Data is implicit in magnitude
 */
export type Quaternion = [number, number, number, number];

export class QuaternionMathematics {
  /**
   * Convert a decision to quaternion representation
   */
  static decisionToQuaternion(
    decision: StrategicDecision,
    state: QuaternionState
  ): Quaternion {
    // Normalize resource changes to unit sphere
    const oreNorm = this.normalizeResourceChange(decision.immediateEffect.oreChange || 0);
    const energyNorm = this.normalizeResourceChange(decision.immediateEffect.energyChange || 0);
    const biomassNorm = this.normalizeResourceChange(decision.immediateEffect.biomassChange || 0);
    const stabilityNorm = decision.immediateEffect.stabilityChange || 0;
    
    // Calculate the angle of rotation (decision impact magnitude)
    const angle = this.calculateDecisionImpactMagnitude(decision, state);
    
    // Construct quaternion components
    const w = Math.cos(angle / 2) * (1 + stabilityNorm);
    const x = Math.sin(angle / 2) * oreNorm;
    const y = Math.sin(angle / 2) * energyNorm;
    const z = Math.sin(angle / 2) * biomassNorm;
    
    return [w, x, y, z];
  }

  /**
   * Apply quaternion decision rotation to state
   */
  static applyQuaternionDecision(
    decisionQ: Quaternion,
    state: QuaternionState
  ): QuaternionState {
    const newState = { ...state };
    
    // Extract rotation components
    const [w, x, y, z] = decisionQ;
    const stabilityRotation = w - 1; // w is 1 + stability change
    const oreRotation = x;
    const energyRotation = y;
    const biomassRotation = z;
    
    // Apply rotational transformation to state
    // Scale by current resource levels to maintain proportional changes
    const scale = 0.1; // Scaling factor to prevent extreme changes
    
    newState.stability *= (1 + stabilityRotation * scale);
    newState.ore *= (1 + oreRotation * scale);
    newState.energy *= (1 + energyRotation * scale);
    newState.biomass *= (1 + biomassRotation * scale);
    
    // Data change is implicit in the transformation complexity
    const dataGain = this.calculateDataGainFromTransformation(decisionQ);
    newState.data += dataGain;
    
    // Update entropy based on quaternion magnitude
    newState.entropy = this.calculateNewEntropy(decisionQ, state);
    
    // Clamp values
    newState.stability = Math.max(0, Math.min(2, newState.stability));
    newState.ore = Math.max(0, Math.min(10000, newState.ore));
    newState.energy = Math.max(0, Math.min(5000, newState.energy));
    newState.biomass = Math.max(0, Math.min(3000, newState.biomass));
    newState.data = Math.max(0, Math.min(2000, newState.data));
    
    return newState;
  }

  /**
   * Calculate entropy from quaternion
   */
  static calculateEntropy(quaternion: Quaternion): number {
    // Entropy = variance of the resource components
    const [w, x, y, z] = quaternion;
    const mean = (x + y + z) / 3;
    const variance = (
      Math.pow(x - mean, 2) +
      Math.pow(y - mean, 2) +
      Math.pow(z - mean, 2)
    ) / 3;
    
    return variance;
  }

  /**
   * Compose two decisions (quaternion multiplication)
   * Q_result = Q2 * Q1 (apply q1 then q2)
   */
  static composeDecisions(q1: Quaternion, q2: Quaternion): Quaternion {
    const [w1, x1, y1, z1] = q1;
    const [w2, x2, y2, z2] = q2;
    
    return [
      w1 * w2 - x1 * x2 - y1 * y2 - z1 * z2,  // w
      w1 * x2 + x1 * w2 + y1 * z2 - z1 * y2,  // x
      w1 * y2 - x1 * z2 + y1 * w2 + z1 * x2,  // y
      w1 * z2 + x1 * y2 - y1 * x2 + z1 * w2   // z
    ];
  }

  /**
   * Normalize resource change to [-1, 1] range
   */
  private static normalizeResourceChange(change: number): number {
    const maxChange = 1000; // Maximum expected change
    return Math.max(-1, Math.min(1, change / maxChange));
  }

  /**
   * Calculate decision impact magnitude (rotation angle)
   */
  private static calculateDecisionImpactMagnitude(
    decision: StrategicDecision,
    state: QuaternionState
  ): number {
    // Base magnitude from resource changes
    const resourceMagnitude = Math.sqrt(
      Math.pow(decision.immediateEffect.oreChange || 0, 2) +
      Math.pow(decision.immediateEffect.energyChange || 0, 2) +
      Math.pow(decision.immediateEffect.biomassChange || 0, 2) +
      Math.pow(decision.immediateEffect.dataChange || 0, 2)
    );
    
    // Normalize to angle (0 to PI/4 for reasonable rotations)
    const maxMagnitude = 2000;
    return (resourceMagnitude / maxMagnitude) * (Math.PI / 4);
  }

  /**
   * Calculate data gain from transformation complexity
   */
  private static calculateDataGainFromTransformation(quaternion: Quaternion): number {
    // Data gain is proportional to the complexity of the transformation
    const [w, x, y, z] = quaternion;
    const magnitude = Math.sqrt(w * w + x * x + y * y + z * z);
    
    // More complex rotations (further from identity) generate more data
    const identityMagnitude = 1;
    const complexity = Math.abs(magnitude - identityMagnitude);
    
    return complexity * 10; // Scale factor
  }

  /**
   * Calculate new entropy after transformation
   */
  private static calculateNewEntropy(
    quaternion: Quaternion,
    state: QuaternionState
  ): number {
    // Entropy increases with transformation magnitude
    const [w, x, y, z] = quaternion;
    const transformationMagnitude = Math.sqrt(x * x + y * y + z * z);
    
    // Base entropy from current state
    const baseEntropy = state.entropy;
    
    // Add entropy from transformation
    const transformationEntropy = transformationMagnitude * 100;
    
    return baseEntropy + transformationEntropy;
  }

  /**
   * Calculate quaternion magnitude
   */
  static magnitude(quaternion: Quaternion): number {
    const [w, x, y, z] = quaternion;
    return Math.sqrt(w * w + x * x + y * y + z * z);
  }

  /**
   * Normalize quaternion to unit quaternion
   */
  static normalize(quaternion: Quaternion): Quaternion {
    const mag = this.magnitude(quaternion);
    if (mag === 0) return [1, 0, 0, 0];
    
    const [w, x, y, z] = quaternion;
    return [w / mag, x / mag, y / mag, z / mag];
  }

  /**
   * Calculate quaternion conjugate (inverse rotation)
   */
  static conjugate(quaternion: Quaternion): Quaternion {
    const [w, x, y, z] = quaternion;
    return [w, -x, -y, -z];
  }

  /**
   * Interpolate between two quaternions (SLERP)
   */
  static slerp(q1: Quaternion, q2: Quaternion, t: number): Quaternion {
    const [w1, x1, y1, z1] = q1;
    const [w2, x2, y2, z2] = q2;
    
    // Calculate dot product
    let dot = w1 * w2 + x1 * x2 + y1 * y2 + z1 * z2;
    
    // If dot < 0, negate one quaternion to take shorter path
    if (dot < 0) {
      dot = -dot;
      const q2Neg: Quaternion = [-w2, -x2, -y2, -z2];
      return this.slerp(q1, q2Neg, t);
    }
    
    // If quaternions are very close, use linear interpolation
    if (dot > 0.9995) {
      return [
        w1 + t * (w2 - w1),
        x1 + t * (x2 - x1),
        y1 + t * (y2 - y1),
        z1 + t * (z2 - z1)
      ];
    }
    
    // Calculate angle
    const theta = Math.acos(dot);
    const sinTheta = Math.sin(theta);
    const sinThetaT = Math.sin(theta * t);
    const sinTheta1MinusT = Math.sin(theta * (1 - t));
    
    return [
      (sinTheta1MinusT * w1 + sinThetaT * w2) / sinTheta,
      (sinTheta1MinusT * x1 + sinThetaT * x2) / sinTheta,
      (sinTheta1MinusT * y1 + sinThetaT * y2) / sinTheta,
      (sinTheta1MinusT * z1 + sinThetaT * z2) / sinTheta
    ];
  }
}


