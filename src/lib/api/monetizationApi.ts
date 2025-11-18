/**
 * Monetization API Client
 * Type-safe methods for interacting with the monetization backend
 */

import { apiClient } from './client';
import type {
  CosmeticsResponse,
  PurchaseCosmeticRequest,
  PurchaseCosmeticResponse,
  ConfirmCosmeticPurchaseRequest,
  ConfirmCosmeticPurchaseResponse,
  BattlePassesResponse,
  PurchaseBattlePassRequest,
  PurchaseBattlePassResponse,
  ActivateBattlePassRequest,
  ActivateBattlePassResponse,
  BattlePassProgressResponse,
  SeasonalPassPurchaseRequest,
  SeasonalPassPurchaseResponse,
  SeasonalPassActivateRequest,
  SeasonalPassActivateResponse,
  CoachingOptionsResponse,
  BookCoachingRequest,
  BookCoachingResponse,
  ConfirmCoachingBookingRequest,
  ConfirmCoachingBookingResponse,
  TournamentsResponse,
  EnterTournamentRequest,
  EnterTournamentResponse,
  ConfirmTournamentEntryRequest,
  ConfirmTournamentEntryResponse,
  SubscriptionStatusResponse,
  CancelSubscriptionRequest,
  CancelSubscriptionResponse,
  InitCustomerRequest,
  InitCustomerResponse,
} from './types';

class MonetizationApi {
  /**
   * Initialize customer account
   */
  async initCustomer(request: InitCustomerRequest): Promise<InitCustomerResponse> {
    const response = await apiClient.post<InitCustomerResponse>(
      '/monetization/init-customer',
      request
    );
    return response.data;
  }

  /**
   * Get cosmetics catalog
   */
  async getCosmetics(): Promise<CosmeticsResponse> {
    const response = await apiClient.get<CosmeticsResponse>('/monetization/shop/cosmetics');
    return response.data;
  }

  /**
   * Purchase cosmetic item
   */
  async purchaseCosmetic(request: PurchaseCosmeticRequest): Promise<PurchaseCosmeticResponse> {
    const response = await apiClient.post<PurchaseCosmeticResponse>(
      '/monetization/shop/purchase-cosmetic',
      request
    );
    return response.data;
  }

  /**
   * Confirm cosmetic purchase
   */
  async confirmCosmeticPurchase(
    request: ConfirmCosmeticPurchaseRequest
  ): Promise<ConfirmCosmeticPurchaseResponse> {
    const response = await apiClient.post<ConfirmCosmeticPurchaseResponse>(
      '/monetization/shop/confirm-cosmetic-purchase',
      request
    );
    return response.data;
  }

  /**
   * Get battle pass options
   */
  async getBattlePasses(): Promise<BattlePassesResponse> {
    const response = await apiClient.get<BattlePassesResponse>('/monetization/battle-pass');
    return response.data;
  }

  /**
   * Purchase battle pass
   */
  async purchaseBattlePass(request: PurchaseBattlePassRequest): Promise<PurchaseBattlePassResponse> {
    const response = await apiClient.post<PurchaseBattlePassResponse>(
      '/monetization/battle-pass/purchase',
      request
    );
    return response.data;
  }

  /**
   * Activate battle pass
   */
  async activateBattlePass(request: ActivateBattlePassRequest): Promise<ActivateBattlePassResponse> {
    const response = await apiClient.post<ActivateBattlePassResponse>(
      '/monetization/battle-pass/activate',
      request
    );
    return response.data;
  }

  /**
   * Get battle pass progress
   */
  async getBattlePassProgress(playerId: string): Promise<BattlePassProgressResponse> {
    const response = await apiClient.get<BattlePassProgressResponse>(
      `/monetization/battle-pass/progress?playerId=${playerId}`
    );
    return response.data;
  }

  /**
   * Purchase seasonal pass
   */
  async purchaseSeasonalPass(
    request: SeasonalPassPurchaseRequest
  ): Promise<SeasonalPassPurchaseResponse> {
    const response = await apiClient.post<SeasonalPassPurchaseResponse>(
      '/monetization/seasonal-pass/purchase',
      request
    );
    return response.data;
  }

  /**
   * Activate seasonal pass
   */
  async activateSeasonalPass(
    request: SeasonalPassActivateRequest
  ): Promise<SeasonalPassActivateResponse> {
    const response = await apiClient.post<SeasonalPassActivateResponse>(
      '/monetization/seasonal-pass/activate',
      request
    );
    return response.data;
  }

  /**
   * Get coaching options
   */
  async getCoachingOptions(): Promise<CoachingOptionsResponse> {
    const response = await apiClient.get<CoachingOptionsResponse>('/monetization/coaching');
    return response.data;
  }

  /**
   * Book coaching session
   */
  async bookCoaching(request: BookCoachingRequest): Promise<BookCoachingResponse> {
    const response = await apiClient.post<BookCoachingResponse>(
      '/monetization/coaching/book',
      request
    );
    return response.data;
  }

  /**
   * Confirm coaching booking
   */
  async confirmCoachingBooking(
    request: ConfirmCoachingBookingRequest
  ): Promise<ConfirmCoachingBookingResponse> {
    const response = await apiClient.post<ConfirmCoachingBookingResponse>(
      '/monetization/coaching/confirm-booking',
      request
    );
    return response.data;
  }

  /**
   * Get tournaments
   */
  async getTournaments(): Promise<TournamentsResponse> {
    const response = await apiClient.get<TournamentsResponse>('/monetization/tournaments');
    return response.data;
  }

  /**
   * Enter tournament
   */
  async enterTournament(request: EnterTournamentRequest): Promise<EnterTournamentResponse> {
    const response = await apiClient.post<EnterTournamentResponse>(
      '/monetization/tournaments/enter',
      request
    );
    return response.data;
  }

  /**
   * Confirm tournament entry
   */
  async confirmTournamentEntry(
    request: ConfirmTournamentEntryRequest
  ): Promise<ConfirmTournamentEntryResponse> {
    const response = await apiClient.post<ConfirmTournamentEntryResponse>(
      '/monetization/tournaments/confirm-entry',
      request
    );
    return response.data;
  }

  /**
   * Get subscription status
   */
  async getSubscriptionStatus(playerId: string): Promise<SubscriptionStatusResponse> {
    const response = await apiClient.get<SubscriptionStatusResponse>(
      `/monetization/subscription/status/${playerId}`
    );
    return response.data;
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(request: CancelSubscriptionRequest): Promise<CancelSubscriptionResponse> {
    const response = await apiClient.post<CancelSubscriptionResponse>(
      '/monetization/subscription/cancel',
      request
    );
    return response.data;
  }
}

// Export singleton instance
export const monetizationApi = new MonetizationApi();
export default monetizationApi;

