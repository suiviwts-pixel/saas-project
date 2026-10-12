import { BaseShippingProvider } from "./base-provider";

export class YalidineProvider extends BaseShippingProvider {
  name = "yalidine";
  protected trackingPrefix = "YAL";
  protected baseCostPerWilaya = 350;
}
