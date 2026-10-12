import { BaseShippingProvider } from "./base-provider";

export class ZRExpressProvider extends BaseShippingProvider {
  name = "zrexpress";
  protected trackingPrefix = "ZR";
  protected baseCostPerWilaya = 400;
}
