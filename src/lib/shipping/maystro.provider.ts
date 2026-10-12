import { BaseShippingProvider } from "./base-provider";

export class MaystroProvider extends BaseShippingProvider {
  name = "maystro";
  protected trackingPrefix = "MYS";
  protected baseCostPerWilaya = 380;
}
