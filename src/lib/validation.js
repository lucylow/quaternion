import { z } from 'zod';

export const createGameSchema = z.object({
  mapWidth: z.number().int().min(16).max(256).optional(),
  mapHeight: z.number().int().min(16).max(256).optional(),
  seed: z.number().int().optional(),
  aiDifficulty: z.enum(['easy', 'medium', 'hard']).optional()
});

export const moveCommandSchema = z.object({
  unitIds: z.array(z.string()).min(1).max(100),
  x: z.number().int().min(0),
  y: z.number().int().min(0)
});

export const attackCommandSchema = z.object({
  unitIds: z.array(z.string()).min(1).max(100),
  targetId: z.string()
});

export const gatherCommandSchema = z.object({
  unitIds: z.array(z.string()).min(1).max(100),
  resourceId: z.string()
});

export const buildUnitSchema = z.object({
  buildingId: z.string(),
  unitType: z.enum(['worker', 'soldier', 'tank', 'air_unit'])
});

export const buildBuildingSchema = z.object({
  playerId: z.number().int().min(0),
  buildingType: z.string(),
  x: z.number().int().min(0),
  y: z.number().int().min(0)
});

export const validate = (schema) => (req, res, next) => {
  try {
    schema.parse(req.body);
    next();
  } catch (error) {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: error.errors
    });
  }
};
