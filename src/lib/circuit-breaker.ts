export enum CircuitState {
  CLOSED = "CLOSED",
  OPEN = "OPEN",
  HALF_OPEN = "HALF_OPEN",
}

/**
 * A simple in-memory circuit breaker used to protect calls to flaky
 * third-party shipping / notification providers. One instance is kept per
 * provider for the lifetime of the server process.
 */
export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failures = 0;
  private successes = 0;
  private lastFailureTime = 0;

  constructor(
    private readonly name: string,
    private readonly failureThreshold = 5,
    private readonly recoveryTimeout = 60000,
    private readonly halfOpenMaxAttempts = 2,
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() - this.lastFailureTime > this.recoveryTimeout) {
        this.state = CircuitState.HALF_OPEN;
        this.successes = 0;
      } else {
        throw new Error(`[${this.name}] Circuit is OPEN. Service temporarily unavailable.`);
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failures = 0;
    if (this.state === CircuitState.HALF_OPEN) {
      this.successes++;
      if (this.successes >= this.halfOpenMaxAttempts) {
        this.state = CircuitState.CLOSED;
      }
    }
  }

  private onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();
    if (this.failures >= this.failureThreshold) {
      this.state = CircuitState.OPEN;
    }
  }

  getState(): CircuitState {
    return this.state;
  }

  reset() {
    this.state = CircuitState.CLOSED;
    this.failures = 0;
    this.successes = 0;
    this.lastFailureTime = 0;
  }
}

const registry = new Map<string, CircuitBreaker>();

export function getCircuitBreaker(name: string): CircuitBreaker {
  if (!registry.has(name)) {
    registry.set(name, new CircuitBreaker(name));
  }
  return registry.get(name)!;
}
