// src/backend/models/SeasonalPass.js
const { ethers } = require('ethers');
const { createClient } = require('@supabase/supabase-js');

class SeasonalPass {
  constructor(playerId, season) {
    this.playerId = playerId;
    this.season = season;
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_KEY
    );
    
    // NFT contract details - optional, can be disabled if not using blockchain
    this.contractAddress = process.env.NFT_CONTRACT_ADDRESS;
    this.provider = process.env.BLOCKCHAIN_RPC_URL 
      ? new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL)
      : null;
    this.wallet = process.env.PRIVATE_KEY && this.provider
      ? new ethers.Wallet(process.env.PRIVATE_KEY, this.provider)
      : null;
  }

  /**
   * Mint NFT badge for seasonal pass (optional - can be disabled)
   */
  async mintNFTBadge() {
    try {
      if (!this.provider || !this.wallet || !this.contractAddress) {
        // Return mock NFT if blockchain not configured
        return {
          contractAddress: 'mock_contract',
          tokenId: `token_${this.playerId}_${this.season}_${Date.now()}`,
          metadata: {
            name: `Quaternion Season ${this.season} Badge`,
            description: `Competitive seasonal badge for Season ${this.season}`,
            image: `ipfs://QmBadge${this.season}`,
            attributes: [
              { trait_type: 'Season', value: this.season },
              { trait_type: 'Issued', value: new Date().toISOString() }
            ]
          },
          transactionHash: `mock_tx_${Date.now()}`
        };
      }

      const { data: playerData } = await this.supabase
        .from('players')
        .select('wallet_address, username')
        .eq('id', this.playerId)
        .single();

      if (!playerData?.wallet_address) {
        // Create mock NFT if wallet not connected
        return this.mintNFTBadge();
      }

      // If contract ABI is available, use it
      // For now, return mock NFT
      const metadata = {
        name: `Quaternion Season ${this.season} Badge`,
        description: `Competitive seasonal badge for Season ${this.season}`,
        image: `ipfs://QmBadge${this.season}`,
        attributes: [
          { trait_type: 'Season', value: this.season },
          { trait_type: 'Player', value: playerData.username },
          { trait_type: 'Issued', value: new Date().toISOString() }
        ]
      };

      const tokenId = `token_${this.playerId}_${this.season}_${Date.now()}`;

      // Store NFT record
      const { data, error } = await this.supabase
        .from('seasonal_nft_badges')
        .insert([
          {
            player_id: this.playerId,
            season: this.season,
            contract_address: this.contractAddress || 'mock_contract',
            token_id: tokenId,
            wallet_address: playerData.wallet_address || null,
            metadata,
            transaction_hash: `mock_tx_${Date.now()}`,
            minted_at: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (error) throw error;

      return {
        contractAddress: this.contractAddress || 'mock_contract',
        tokenId,
        metadata,
        transactionHash: data.transaction_hash
      };
    } catch (error) {
      console.error('Failed to mint NFT badge:', error);
      throw error;
    }
  }

  /**
   * Register for seasonal ranking
   */
  async registerForSeason() {
    try {
      const { data, error } = await this.supabase
        .from('seasonal_rankings')
        .insert([
          {
            player_id: this.playerId,
            season: this.season,
            rating: 1200, // Starting rating
            wins: 0,
            losses: 0,
            registered_at: new Date().toISOString()
          }
        ])
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error('Failed to register for season:', error);
      throw error;
    }
  }

  /**
   * Record seasonal game result
   */
  async recordGameResult(opponentId, won, rating) {
    try {
      const { data: seasonData, error: seasonError } = await this.supabase
        .from('seasonal_rankings')
        .select('*')
        .eq('player_id', this.playerId)
        .eq('season', this.season)
        .single();

      if (seasonError || !seasonData) {
        throw new Error('Not registered for this season');
      }

      const newRating = rating;
      const wins = seasonData.wins + (won ? 1 : 0);
      const losses = seasonData.losses + (won ? 0 : 1);

      const { data, error } = await this.supabase
        .from('seasonal_rankings')
        .update({
          rating: newRating,
          wins,
          losses
        })
        .eq('id', seasonData.id)
        .select()
        .single();

      if (error) throw error;

      return { ...data, ratingChange: newRating - seasonData.rating };
    } catch (error) {
      console.error('Failed to record game result:', error);
      throw error;
    }
  }

  /**
   * Get seasonal leaderboard
   */
  async getLeaderboard(limit = 100) {
    try {
      const { data, error } = await this.supabase
        .from('seasonal_rankings')
        .select('player_id, rating, wins, losses')
        .eq('season', this.season)
        .order('rating', { ascending: false })
        .limit(limit);

      if (error) throw error;

      // Get player usernames
      const playerIds = data.map(entry => entry.player_id);
      const { data: players } = await this.supabase
        .from('players')
        .select('id, username')
        .in('id', playerIds);

      const playerMap = new Map(players?.map(p => [p.id, p.username]) || []);

      return data.map((entry, index) => ({
        rank: index + 1,
        playerId: entry.player_id,
        username: playerMap.get(entry.player_id) || 'Unknown',
        rating: entry.rating,
        wins: entry.wins,
        losses: entry.losses,
        winRate: entry.wins + entry.losses > 0 
          ? ((entry.wins / (entry.wins + entry.losses)) * 100).toFixed(1)
          : '0.0'
      }));
    } catch (error) {
      console.error('Failed to get leaderboard:', error);
      throw error;
    }
  }
}

module.exports = { SeasonalPass };

