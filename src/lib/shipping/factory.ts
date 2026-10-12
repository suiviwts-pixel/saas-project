import { ZRExpressProvider } from "./zrexpress.provider";
import { YalidineProvider } from "./yalidine.provider";
import { MaystroProvider } from "./maystro.provider";
import type { ShippingProvider } from "./types";

const providers = new Map<string, ShippingProvider>([
  ["zrexpress", new ZRExpressProvider()],
  ["yalidine", new YalidineProvider()],
  ["maystro", new MaystroProvider()],
]);

export function getShippingProvider(name: string): ShippingProvider {
  const provider = providers.get(name.toLowerCase());
  if (!provider) {
    throw new Error(`Shipping provider "${name}" is not supported`);
  }
  return provider;
}

export function getAvailableProviders(): string[] {
  return Array.from(providers.keys());
}
