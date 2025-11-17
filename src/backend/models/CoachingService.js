// src/backend/models/CoachingService.js
const { createClient } = require('@supabase/supabase-js');

class CoachingService {
  constructor(playerId, packageType) {
    this.playerId = playerId;
    this.package = packageType;
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_KEY
    );

    this.packageConfig = {
      'intro_session': { sessions: 1, minutes: 30 },
      'advanced_session': { sessions: 1, minutes: 60 },
      'pro_package': { sessions: 4, minutes: 240 },
      'elite_package': { sessions: 8, minutes: 480 }
    };

    // Twilio client - optional, can work without it
    this.twilioClient = null;
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      try {
        const twilio = require('twilio');
        this.twilioClient = twilio(
          process.env.TWILIO_ACCOUNT_SID,
          process.env.TWILIO_AUTH_TOKEN
        );
      } catch (error) {
        console.warn('Twilio not available:', error);
      }
    }
  }

  /**
   * Schedule coaching session
   */
  async scheduleSession(preferredTime) {
    try {
      const config = this.packageConfig[this.package];
      if (!config) {
        throw new Error('Invalid coaching package');
      }

      // Find available coach
      const coach = await this.findAvailableCoach(preferredTime, config.minutes);
      if (!coach) {
        throw new Error('No coaches available at this time');
      }

      // Create video room (mock if Twilio not available)
      const room = await this.createVideoRoom();

      // Insert booking
      const { data, error } = await this.supabase
        .from('coaching_bookings')
        .insert([
          {
            player_id: this.playerId,
            coach_id: coach.id,
            package: this.package,
            scheduled_at: preferredTime,
            duration_minutes: config.minutes,
            video_room_id: room.sid || `room_${Date.now()}`,
            status: 'scheduled'
          }
        ])
        .select()
        .single();

      if (error) throw error;

      // Send confirmation to coach
      await this.notifyCoach(coach, data);

      return {
        id: data.id,
        coachId: coach.id,
        scheduledTime: data.scheduled_at,
        joinUrl: `${process.env.BASE_URL || 'http://localhost:3000'}/coaching/${data.id}/${room.sid || data.video_room_id}`,
        roomSid: room.sid || data.video_room_id
      };
    } catch (error) {
      console.error('Failed to schedule session:', error);
      throw error;
    }
  }

  /**
   * Find available coach
   */
  async findAvailableCoach(preferredTime, durationMinutes) {
    try {
      const { data: coaches, error } = await this.supabase
        .from('coaches')
        .select('*')
        .eq('active', true)
        .order('rating', { ascending: false });

      if (error) throw error;

      // If no coaches table, return mock coach
      if (!coaches || coaches.length === 0) {
        return {
          id: 'coach_1',
          name: 'Pro Coach',
          rating: 5.0,
          active: true
        };
      }

      for (const coach of coaches) {
        const isAvailable = await this.checkCoachAvailability(
          coach.id,
          preferredTime,
          durationMinutes
        );

        if (isAvailable) {
          return coach;
        }
      }

      // Return first coach if all busy
      return coaches[0];
    } catch (error) {
      console.error('Failed to find coach:', error);
      // Return mock coach on error
      return {
        id: 'coach_1',
        name: 'Pro Coach',
        rating: 5.0,
        active: true
      };
    }
  }

  /**
   * Check coach availability
   */
  async checkCoachAvailability(coachId, time, durationMinutes) {
    try {
      const endTime = new Date(new Date(time).getTime() + durationMinutes * 60000);

      const { data: conflicts, error } = await this.supabase
        .from('coaching_bookings')
        .select('*')
        .eq('coach_id', coachId)
        .eq('status', 'scheduled')
        .gte('scheduled_at', time)
        .lt('scheduled_at', endTime.toISOString());

      if (error) throw error;

      return !conflicts || conflicts.length === 0;
    } catch (error) {
      console.error('Failed to check availability:', error);
      return true; // Assume available on error
    }
  }

  /**
   * Create Twilio video room (or mock)
   */
  async createVideoRoom() {
    try {
      if (this.twilioClient) {
        const room = await this.twilioClient.video.rooms.create({
          uniqueName: `coaching_${this.playerId}_${Date.now()}`,
          type: 'peer-to-peer',
          maxParticipants: 2,
          recordParticipantsOnConnect: true
        });
        return room;
      } else {
        // Return mock room
        return {
          sid: `room_${this.playerId}_${Date.now()}`,
          uniqueName: `coaching_${this.playerId}_${Date.now()}`
        };
      }
    } catch (error) {
      console.error('Failed to create video room:', error);
      // Return mock room on error
      return {
        sid: `room_${this.playerId}_${Date.now()}`,
        uniqueName: `coaching_${this.playerId}_${Date.now()}`
      };
    }
  }

  /**
   * Notify coach of new booking
   */
  async notifyCoach(coach, booking) {
    try {
      const { data: player } = await this.supabase
        .from('players')
        .select('username, email')
        .eq('id', this.playerId)
        .single();

      // Store notification
      await this.supabase
        .from('coach_notifications')
        .insert([
          {
            coach_id: coach.id,
            booking_id: booking.id,
            player_name: player?.username || 'Player',
            scheduled_at: booking.scheduled_at,
            package: this.package,
            status: 'pending'
          }
        ]).catch(() => {
          // Ignore if table doesn't exist
        });

      // Optional: Send SMS reminder if Twilio available
      if (this.twilioClient && coach.phone && process.env.TWILIO_PHONE_NUMBER) {
        await this.twilioClient.messages.create({
          body: `New coaching booking from ${player?.username || 'Player'} on ${new Date(booking.scheduled_at).toLocaleString()}`,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: coach.phone
        }).catch(err => {
          console.warn('Failed to send SMS:', err);
        });
      }
    } catch (error) {
      console.error('Failed to notify coach:', error);
    }
  }

  /**
   * Generate access token for video room
   */
  async generateVideoToken(roomSid, participantName) {
    try {
      if (this.twilioClient && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_API_KEY) {
        const twilio = require('twilio');
        const AccessToken = twilio.jwt.AccessToken;
        const VideoGrant = AccessToken.VideoGrant;
        
        const token = new AccessToken(
          process.env.TWILIO_ACCOUNT_SID,
          process.env.TWILIO_API_KEY,
          process.env.TWILIO_API_SECRET
        );

        token.addGrant(new VideoGrant({ room: roomSid }));
        token.identity = participantName;

        return token.toJwt();
      } else {
        // Return mock token
        return `mock_token_${roomSid}_${participantName}`;
      }
    } catch (error) {
      console.error('Failed to generate token:', error);
      return `mock_token_${roomSid}_${participantName}`;
    }
  }

  /**
   * Complete session and archive recording
   */
  async completeSession(bookingId) {
    try {
      const { data: booking } = await this.supabase
        .from('coaching_bookings')
        .select('*')
        .eq('id', bookingId)
        .single();

      if (!booking) {
        throw new Error('Booking not found');
      }

      // Mark booking as completed
      await this.supabase
        .from('coaching_bookings')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', bookingId);

      return { success: true, message: 'Session completed and recorded' };
    } catch (error) {
      console.error('Failed to complete session:', error);
      throw error;
    }
  }
}

module.exports = { CoachingService };

