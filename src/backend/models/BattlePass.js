// src/backend/models/BattlePass.js
import { createClient } from '@supabase/supabase-js';

class BattlePass {
  constructor(playerId, passType) {
    this.playerId = playerId;
    this.passType = passType; // 'standard_pass', 'premium_pass', 'yearly_pass'
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_KEY
    );

    this.passConfig = {
      'standard_pass': {
        totalRewards: 50,
        duration: 90, // days
        price: 9.99
      },
      'premium_pass': {
        totalRewards: 100,
        duration: 90,
        price: 19.99
      },
      'yearly_pass': {
        totalRewards: 400,
        duration: 365,
        price: 49.99
      }
    };
  }

  /**
   * Activate battle pass for player
   */
  async activate() {
    try {
      const config = this.passConfig[this.passType];
      const activatedAt = new Date();
      const expiresAt = new Date(activatedAt.getTime() + config.duration * 24 * 60 * 60 * 1000);

      const { data, error } = await this.supabase
        .from('battle_passes')
        .insert([
          {
            player_id: this.playerId,
            pass_type: this.passType,
            total_rewards: config.totalRewards,
            current_level: 1,
            progress: 0,
            activated_at: activatedAt.toISOString(),
            expires_at: expiresAt.toISOString(),
            active: true
          }
        ])
        .select()
        .single();

      if (error) throw error;

      // Initialize reward tracking
      await this.initializeRewards(data.id);

      return data;
    } catch (error) {
      console.error('Failed to activate battle pass:', error);
      throw error;
    }
  }

  /**
   * Initialize all rewards for this battle pass
   */
  async initializeRewards(passId) {
    try {
      const config = this.passConfig[this.passType];
      const rewards = [];

      for (let level = 1; level <= config.totalRewards; level++) {
        rewards.push({
          battle_pass_id: passId,
          level,
          reward_type: this.generateRewardType(level),
          reward_id: `reward_${level}_${this.passType}`,
          claimed: false
        });
      }

      const { error } = await this.supabase
        .from('battle_pass_rewards')
        .insert(rewards);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to initialize rewards:', error);
      throw error;
    }
  }

  /**
   * Generate reward based on level
   */
  generateRewardType(level) {
    const rewardTypes = [
      'cosmetic', 'cosmetic', 'xp_booster',
      'currency', 'cosmetic', 'cosmetic',
      'weapon_skin', 'cosmetic', 'cosmetic',
      'victory_effect', 'cosmetic', 'cosmetic'
    ];

    const index = (level - 1) % rewardTypes.length;
    return rewardTypes[index];
  }

  /**
   * Claim battle pass reward
   */
  async claimReward(level) {
    try {
      const { data: passData, error: passError } = await this.supabase
        .from('battle_passes')
        .select('id')
        .eq('player_id', this.playerId)
        .eq('pass_type', this.passType)
        .eq('active', true)
        .single();

      if (passError) throw new Error('Active battle pass not found');

      const { data: reward, error: rewardError } = await this.supabase
        .from('battle_pass_rewards')
        .update({ claimed: true, claimed_at: new Date().toISOString() })
        .eq('battle_pass_id', passData.id)
        .eq('level', level)
        .select()
        .single();

      if (rewardError) throw rewardError;

      // Add reward to player inventory
      await this.grantReward(reward);

      return { success: true, reward };
    } catch (error) {
      console.error('Failed to claim reward:', error);
      throw error;
    }
  }

  /**
   * Grant reward to player based on type
   */
  async grantReward(reward) {
    try {
      switch (reward.reward_type) {
        case 'cosmetic':
          // Add cosmetic to inventory
          await this.supabase
            .from('player_cosmetics')
            .insert([
              {
                player_id: this.playerId,
                cosmetic_id: reward.reward_id,
                acquired_at: new Date().toISOString()
              }
            ]);
          break;

        case 'xp_booster':
          // Add XP booster
          await this.supabase
            .from('player_boosters')
            .insert([
              {
                player_id: this.playerId,
                booster_type: 'xp',
                multiplier: 1.5,
                duration_hours: 24,
                activated_at: new Date().toISOString()
              }
            ]);
          break;

        case 'currency':
          // Add premium currency
          const { data: currency } = await this.supabase
            .from('player_currency')
            .select('premium_currency')
            .eq('player_id', this.playerId)
            .single();

          await this.supabase
            .from('player_currency')
            .update({
              premium_currency: (currency?.premium_currency || 0) + 100
            })
            .eq('player_id', this.playerId);
          break;

        case 'weapon_skin':
        case 'victory_effect':
          // Add cosmetic
          await this.supabase
            .from('player_cosmetics')
            .insert([
              {
                player_id: this.playerId,
                cosmetic_id: reward.reward_id,
                acquired_at: new Date().toISOString()
              }
            ]);
          break;
      }
    } catch (error) {
      console.error('Failed to grant reward:', error);
      throw error;
    }
  }

  /**
   * Add XP and check for level up
   */
  async addXP(xpAmount) {
    try {
      const { data: pass, error: passError } = await this.supabase
        .from('battle_passes')
        .select('*')
        .eq('player_id', this.playerId)
        .eq('pass_type', this.passType)
        .eq('active', true)
        .single();

      if (passError) throw new Error('Active battle pass not found');

      const xpPerLevel = 1000;
      let newProgress = pass.progress + xpAmount;
      let newLevel = pass.current_level;

      while (newProgress >= xpPerLevel) {
        newLevel++;
        newProgress -= xpPerLevel;

        if (newLevel > this.passConfig[this.passType].totalRewards) {
          newLevel = this.passConfig[this.passType].totalRewards;
          newProgress = 0;
          break;
        }
      }

      const { data, error } = await this.supabase
        .from('battle_passes')
        .update({
          current_level: newLevel,
          progress: newProgress
        })
        .eq('id', pass.id)
        .select()
        .single();

      if (error) throw error;

      return {
        level: data.current_level,
        progress: data.progress,
        leveledUp: newLevel > pass.current_level
      };
    } catch (error) {
      console.error('Failed to add XP:', error);
      throw error;
    }
  }

  /**
   * Get current battle pass progress
   */
  async getProgress() {
    try {
      const { data, error } = await this.supabase
        .from('battle_passes')
        .select('*')
        .eq('player_id', this.playerId)
        .eq('pass_type', this.passType)
        .eq('active', true)
        .single();

      if (error) throw new Error('Active battle pass not found');

      const { data: rewards, error: rewardsError } = await this.supabase
        .from('battle_pass_rewards')
        .select('*')
        .eq('battle_pass_id', data.id)
        .order('level', { ascending: true });

      if (rewardsError) throw rewardsError;

      return {
        passType: this.passType,
        currentLevel: data.current_level,
        progress: data.progress,
        totalRewards: data.total_rewards,
        rewards: rewards || [],
        expiresAt: data.expires_at
      };
    } catch (error) {
      console.error('Failed to get progress:', error);
      throw error;
    }
  }

  /**
   * Get total rewards count
   */
  getTotalRewards() {
    return this.passConfig[this.passType].totalRewards;
  }

  /**
   * Get expiration date
   */
  getExpirationDate() {
    const config = this.passConfig[this.passType];
    const now = new Date();
    return new Date(now.getTime() + config.duration * 24 * 60 * 60 * 1000);
  }
}

export { BattlePass };

