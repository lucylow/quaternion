// src/backend/models/PlayerInventory.js
const { createClient } = require('@supabase/supabase-js');

class PlayerInventory {
  constructor(playerId) {
    this.playerId = playerId;
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_KEY
    );
  }

  /**
   * Add cosmetic to inventory
   */
  async addCosmetic(cosmeticId) {
    try {
      const { data, error } = await this.supabase
        .from('player_cosmetics')
        .insert([
          {
            player_id: this.playerId,
            cosmetic_id: cosmeticId,
            acquired_at: new Date().toISOString(),
            active: false
          }
        ]);

      if (error) throw error;

      return {
        success: true,
        cosmeticId,
        message: 'Cosmetic added to inventory'
      };
    } catch (error) {
      console.error('Failed to add cosmetic:', error);
      throw error;
    }
  }

  /**
   * Get all cosmetics owned by player
   */
  async getInventory() {
    try {
      const { data, error } = await this.supabase
        .from('player_cosmetics')
        .select('*')
        .eq('player_id', this.playerId)
        .order('acquired_at', { ascending: false });

      if (error) throw error;

      return {
        playerId: this.playerId,
        cosmetics: data || [],
        totalCount: data?.length || 0
      };
    } catch (error) {
      console.error('Failed to get inventory:', error);
      throw error;
    }
  }

  /**
   * Equip cosmetic for use in-game
   */
  async equipCosmetic(cosmeticId, slotType) {
    try {
      // First check if player owns it
      const { data: owned, error: ownedError } = await this.supabase
        .from('player_cosmetics')
        .select('*')
        .eq('player_id', this.playerId)
        .eq('cosmetic_id', cosmeticId)
        .single();

      if (ownedError || !owned) {
        throw new Error('Cosmetic not owned');
      }

      // Deactivate previous cosmetic in this slot
      await this.supabase
        .from('player_cosmetics')
        .update({ active: false })
        .eq('player_id', this.playerId)
        .eq('slot_type', slotType);

      // Activate this cosmetic
      const { data, error } = await this.supabase
        .from('player_cosmetics')
        .update({ active: true, slot_type: slotType })
        .eq('cosmetic_id', cosmeticId)
        .eq('player_id', this.playerId);

      if (error) throw error;

      return { success: true, message: 'Cosmetic equipped' };
    } catch (error) {
      console.error('Failed to equip cosmetic:', error);
      throw error;
    }
  }

  /**
   * Get currently active cosmetics
   */
  async getActiveCosmetics() {
    try {
      const { data, error } = await this.supabase
        .from('player_cosmetics')
        .select('*')
        .eq('player_id', this.playerId)
        .eq('active', true);

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Failed to get active cosmetics:', error);
      throw error;
    }
  }

  /**
   * Check cosmetic ownership
   */
  async ownsCosmetic(cosmeticId) {
    try {
      const { data, error } = await this.supabase
        .from('player_cosmetics')
        .select('id')
        .eq('player_id', this.playerId)
        .eq('cosmetic_id', cosmeticId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      return !!data;
    } catch (error) {
      console.error('Failed to check cosmetic ownership:', error);
      return false;
    }
  }
}

module.exports = { PlayerInventory };

