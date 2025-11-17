// src/backend/models/EsportsTournament.js
const { createClient } = require('@supabase/supabase-js');

class EsportsTournament {
  constructor(tournamentId) {
    this.tournamentId = tournamentId;
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_KEY
    );

    this.tournamentConfig = {
      'weekly_clash': {
        format: 'single_elimination',
        maxParticipants: 64,
        startTime: 'every_friday_8pm',
        prizePool: 1000
      },
      'monthly_championship': {
        format: 'double_elimination',
        maxParticipants: 32,
        startTime: 'last_sunday_month',
        prizePool: 5000
      },
      'world_finals': {
        format: 'swiss',
        maxParticipants: 16,
        startTime: 'quarterly',
        prizePool: 50000
      }
    };
  }

  /**
   * Register player in tournament
   */
  async registerPlayer(playerId) {
    try {
      const config = this.tournamentConfig[this.tournamentId];

      // Check capacity
      const { data: existingPlayers, error: countError } = await this.supabase
        .from('tournament_registrations')
        .select('id')
        .eq('tournament_id', this.tournamentId)
        .eq('status', 'registered');

      if (countError) throw countError;

      if (existingPlayers && existingPlayers.length >= config.maxParticipants) {
        throw new Error('Tournament is full');
      }

      // Register player
      const { data: registration, error } = await this.supabase
        .from('tournament_registrations')
        .insert([
          {
            tournament_id: this.tournamentId,
            player_id: playerId,
            status: 'registered',
            registered_at: new Date().toISOString(),
            seed: (existingPlayers?.length || 0) + 1
          }
        ])
        .select()
        .single();

      if (error) throw error;

      // Check if tournament is full and can start bracket generation
      if (existingPlayers && existingPlayers.length + 1 === config.maxParticipants) {
        await this.generateBracket();
      }

      return {
        registrationId: registration.id,
        bracket: registration.bracket || null
      };
    } catch (error) {
      console.error('Failed to register player:', error);
      throw error;
    }
  }

  /**
   * Generate tournament bracket
   */
  async generateBracket() {
    try {
      const { data: players, error } = await this.supabase
        .from('tournament_registrations')
        .select('*')
        .eq('tournament_id', this.tournamentId)
        .eq('status', 'registered')
        .order('seed', { ascending: true });

      if (error) throw error;

      const config = this.tournamentConfig[this.tournamentId];
      const bracket = this.createBracket(players || [], config.format);

      // Store bracket matches
      for (const match of bracket.matches) {
        await this.supabase
          .from('tournament_matches')
          .insert([match]);
      }

      // Update tournament status if tournaments table exists
      await this.supabase
        .from('tournaments')
        .update({ status: 'bracket_ready', bracket_data: bracket })
        .eq('id', this.tournamentId)
        .catch(() => {
          // Ignore if table doesn't exist
        });

      return bracket;
    } catch (error) {
      console.error('Failed to generate bracket:', error);
      throw error;
    }
  }

  /**
   * Create bracket structure
   */
  createBracket(players, format) {
    const matches = [];
    let matchId = 1;

    if (format === 'single_elimination') {
      // Pair consecutive players
      for (let i = 0; i < players.length; i += 2) {
        matches.push({
          match_number: matchId++,
          tournament_id: this.tournamentId,
          player1_id: players[i].player_id,
          player2_id: players[i + 1]?.player_id || null,
          round: 1,
          status: 'pending'
        });
      }
    } else if (format === 'double_elimination') {
      // Winners bracket
      for (let i = 0; i < players.length; i += 2) {
        matches.push({
          match_number: matchId++,
          tournament_id: this.tournamentId,
          player1_id: players[i].player_id,
          player2_id: players[i + 1]?.player_id || null,
          round: 1,
          bracket: 'winners',
          status: 'pending'
        });
      }
    } else if (format === 'swiss') {
      // Swiss format - round robin style
      for (let i = 0; i < players.length; i += 2) {
        matches.push({
          match_number: matchId++,
          tournament_id: this.tournamentId,
          player1_id: players[i].player_id,
          player2_id: players[i + 1]?.player_id || null,
          round: 1,
          bracket: 'swiss',
          status: 'pending'
        });
      }
    }

    return {
      format,
      totalMatches: matches.length,
      matches
    };
  }

  /**
   * Record match result
   */
  async recordMatchResult(matchId, winnerId, loserId, stats = {}) {
    try {
      const { data: match, error: matchError } = await this.supabase
        .from('tournament_matches')
        .select('*')
        .eq('id', matchId)
        .single();

      if (matchError) throw matchError;

      const { data: updatedMatch, error: updateError } = await this.supabase
        .from('tournament_matches')
        .update({
          player1_score: winnerId === match.player1_id ? 1 : 0,
          player2_score: loserId === match.player1_id ? 0 : 1,
          winner_id: winnerId,
          status: 'completed',
          completed_at: new Date().toISOString(),
          stats
        })
        .eq('id', matchId)
        .select()
        .single();

      if (updateError) throw updateError;

      // Advance winner to next round
      await this.advanceWinner(winnerId, match.round + 1);

      return updatedMatch;
    } catch (error) {
      console.error('Failed to record match result:', error);
      throw error;
    }
  }

  /**
   * Advance winner to next round
   */
  async advanceWinner(playerId, nextRound) {
    try {
      // Create next round match for winner
      await this.supabase
        .from('tournament_matches')
        .insert([
          {
            tournament_id: this.tournamentId,
            player1_id: playerId,
            round: nextRound,
            status: 'pending'
          }
        ])
        .catch(() => {
          // Ignore if already exists
        });
    } catch (error) {
      console.error('Failed to advance winner:', error);
    }
  }

  /**
   * Get tournament bracket status
   */
  async getBracketStatus() {
    try {
      const { data: matches, error } = await this.supabase
        .from('tournament_matches')
        .select('*')
        .eq('tournament_id', this.tournamentId)
        .order('round', { ascending: true })
        .order('match_number', { ascending: true });

      if (error) throw error;

      const completed = matches?.filter(m => m.status === 'completed').length || 0;
      const total = matches?.length || 0;

      return {
        tournamentId: this.tournamentId,
        totalMatches: total,
        completedMatches: completed,
        progress: total > 0 ? ((completed / total) * 100).toFixed(1) : '0.0',
        matches: matches || []
      };
    } catch (error) {
      console.error('Failed to get bracket status:', error);
      throw error;
    }
  }

  /**
   * Calculate and distribute prizes
   */
  async distributePrizes() {
    try {
      const config = this.tournamentConfig[this.tournamentId];
      const { data: matches } = await this.supabase
        .from('tournament_matches')
        .select('*')
        .eq('tournament_id', this.tournamentId)
        .eq('status', 'completed');

      if (!matches || matches.length === 0) {
        throw new Error('Tournament not completed');
      }

      // Find finalists
      const maxRound = Math.max(...matches.map(m => m.round));
      const finalMatches = matches.filter(m => m.round === maxRound);

      if (finalMatches.length === 0) {
        throw new Error('Tournament not completed');
      }

      const winnerOfFinal = finalMatches[0].winner_id;
      const runnerUp = finalMatches[0].player1_id === winnerOfFinal 
        ? finalMatches[0].player2_id 
        : finalMatches[0].player1_id;

      // Standard prize distribution
      const prizes = {
        [winnerOfFinal]: config.prizePool * 0.5,
        [runnerUp]: config.prizePool * 0.3
      };

      // Distribute prizes
      for (const [playerId, amount] of Object.entries(prizes)) {
        await this.supabase
          .from('prize_distributions')
          .insert([
            {
              tournament_id: this.tournamentId,
              player_id: playerId,
              amount,
              status: 'pending',
              created_at: new Date().toISOString()
            }
          ])
          .catch(() => {
            // Ignore if table doesn't exist
          });
      }

      return prizes;
    } catch (error) {
      console.error('Failed to distribute prizes:', error);
      throw error;
    }
  }

  /**
   * Get tournament start time
   */
  getStartTime() {
    const config = this.tournamentConfig[this.tournamentId];
    // Implementation depends on schedule
    return new Date();
  }
}

module.exports = { EsportsTournament };

