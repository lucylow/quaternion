/**
 * Rooms API Client
 * Type-safe methods for interacting with the rooms/multiplayer lobby backend
 */

import { apiClient } from './client';
import type {
  CreateRoomRequest,
  CreateRoomResponse,
  JoinRoomRequest,
  JoinRoomResponse,
  ListRoomsResponse,
  LeaveRoomRequest,
  StartRoomRequest,
  Room,
} from './types';

class RoomsApi {
  /**
   * List all available rooms
   */
  async listRooms(): Promise<Room[]> {
    const response = await apiClient.get<ListRoomsResponse>('/rooms');
    return response.data.rooms;
  }

  /**
   * Create a new room
   */
  async createRoom(request: CreateRoomRequest): Promise<CreateRoomResponse> {
    const response = await apiClient.post<CreateRoomResponse>('/rooms', request);
    return response.data;
  }

  /**
   * Get room details by ID
   */
  async getRoom(roomId: string): Promise<Room> {
    const response = await apiClient.get<Room>(`/rooms/${roomId}`);
    return response.data;
  }

  /**
   * Join an existing room
   */
  async joinRoom(roomId: string, request: JoinRoomRequest): Promise<JoinRoomResponse> {
    const response = await apiClient.post<JoinRoomResponse>(
      `/rooms/${roomId}/join`,
      request
    );
    return response.data;
  }

  /**
   * Leave a room
   */
  async leaveRoom(roomId: string, request: LeaveRoomRequest): Promise<{ message: string }> {
    const response = await apiClient.post<{ message: string }>(
      `/rooms/${roomId}/leave`,
      request
    );
    return response.data;
  }

  /**
   * Start a room (host only)
   */
  async startRoom(roomId: string, request: StartRoomRequest): Promise<{ roomId: string; room: Room }> {
    const response = await apiClient.post<{ roomId: string; room: Room }>(
      `/rooms/${roomId}/start`,
      request
    );
    return response.data;
  }
}

// Export singleton instance
export const roomsApi = new RoomsApi();
export default roomsApi;

