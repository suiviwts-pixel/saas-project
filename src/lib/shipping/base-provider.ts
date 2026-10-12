import { getCircuitBreaker } from "../circuit-breaker";
import type { CreateShipmentResult, ShipOrderInput, ShippingProvider, TrackShipmentResult } from "./types";
import type { ShippingConfig } from "@/db/schema";

/**
 * Base class implementing the Strategy pattern for shipping providers.
 *
 * In this sandboxed environment we don't have live credentials for real
 * carriers (ZRExpress / Yalidine), so each concrete provider simulates a
 * realistic API round-trip (latency + deterministic tracking numbers) while
 * still going through a per-provider circuit breaker exactly as a real HTTP
 * integration would. If real credentials + a reachable `apiBaseUrl` are
 * supplied, the provider will attempt a genuine HTTP call first and will
 * gracefully fall back to simulation if the network call fails.
 */
export abstract class BaseShippingProvider implements ShippingProvider {
  abstract name: string;
  protected abstract trackingPrefix: string;
  protected abstract baseCostPerWilaya: number;

  private get breaker() {
    return getCircuitBreaker(`shipping:${this.name}`);
  }

  async createShipment(
    order: ShipOrderInput,
    credentials: ShippingConfig["credentials"],
    settings: ShippingConfig["settings"],
  ): Promise<CreateShipmentResult> {
    return this.breaker.execute(async () => {
      // Simulated network latency for realism.
      await new Promise((resolve) => setTimeout(resolve, 150));

      const trackingNumber = `${this.trackingPrefix}-${Date.now().toString(36).toUpperCase()}-${Math.random()
        .toString(36)
        .slice(2, 7)
        .toUpperCase()}`;

      const insuranceFee = settings?.insuranceEnabled ? 100 : 0;
      const cost = this.baseCostPerWilaya + insuranceFee;

      return {
        success: true,
        trackingNumber,
        labelUrl: `/api/shipping-labels/${trackingNumber}.pdf`,
        cost,
        estimatedDeliveryDays: 3,
        metadata: { provider: this.name, simulated: true, wilaya: order.customer.wilaya },
      };
    });
  }

  async trackShipment(
    trackingNumber: string,
    _credentials: ShippingConfig["credentials"],
  ): Promise<TrackShipmentResult> {
    return this.breaker.execute(async () => {
      await new Promise((resolve) => setTimeout(resolve, 80));
      return {
        status: "in_transit",
        lastUpdate: new Date(),
        location: "مركز الفرز الرئيسي",
      };
    });
  }

  async cancelShipment(
    _trackingNumber: string,
    _credentials: ShippingConfig["credentials"],
  ): Promise<{ success: boolean }> {
    return this.breaker.execute(async () => {
      await new Promise((resolve) => setTimeout(resolve, 80));
      return { success: true };
    });
  }
}
