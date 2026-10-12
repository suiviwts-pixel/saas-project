import type { OrderCustomer, OrderItem, ShippingConfig } from "@/db/schema";

export type ShipOrderInput = {
  id: string;
  externalOrderId: string;
  customer: OrderCustomer;
  items: OrderItem[];
  totalPrice: number;
};

export type CreateShipmentResult = {
  success: boolean;
  trackingNumber: string;
  labelUrl?: string;
  cost: number;
  estimatedDeliveryDays?: number;
  metadata?: Record<string, unknown>;
};

export type TrackShipmentResult = {
  status: string;
  lastUpdate: Date;
  location?: string;
};

export interface ShippingProvider {
  name: string;
  createShipment(
    order: ShipOrderInput,
    credentials: ShippingConfig["credentials"],
    settings: ShippingConfig["settings"],
  ): Promise<CreateShipmentResult>;
  trackShipment(trackingNumber: string, credentials: ShippingConfig["credentials"]): Promise<TrackShipmentResult>;
  cancelShipment(trackingNumber: string, credentials: ShippingConfig["credentials"]): Promise<{ success: boolean }>;
}
