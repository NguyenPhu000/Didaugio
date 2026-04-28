const STATE_CLOSED = "closed";
const STATE_OPEN = "open";
const STATE_HALF_OPEN = "half-open";

class CircuitBreaker {
  constructor({
    failureThreshold = 5,
    cooldownMs = 30000,
    halfOpenMaxRequests = 1,
    clock = () => Date.now(),
  } = {}) {
    this.failureThreshold = Math.max(1, Number(failureThreshold) || 5);
    this.cooldownMs = Math.max(1000, Number(cooldownMs) || 30000);
    this.halfOpenMaxRequests = Math.max(
      1,
      Number(halfOpenMaxRequests) || 1,
    );
    this.clock = clock;
    this.state = STATE_CLOSED;
    this.failureCount = 0;
    this.openedAt = null;
    this.lastFailureAt = null;
    this.lastSuccessAt = null;
    this.halfOpenInFlight = 0;
  }

  canRequest() {
    if (this.state !== STATE_OPEN) {
      if (this.state === STATE_HALF_OPEN) {
        return this.halfOpenInFlight < this.halfOpenMaxRequests;
      }
      return true;
    }

    const elapsed = this.clock() - Number(this.openedAt || 0);
    if (elapsed < this.cooldownMs) return false;

    this.state = STATE_HALF_OPEN;
    this.halfOpenInFlight = 0;
    return true;
  }

  beforeRequest() {
    if (!this.canRequest()) return false;
    if (this.state === STATE_HALF_OPEN) {
      this.halfOpenInFlight += 1;
    }
    return true;
  }

  recordSuccess() {
    this.state = STATE_CLOSED;
    this.failureCount = 0;
    this.openedAt = null;
    this.halfOpenInFlight = 0;
    this.lastSuccessAt = new Date(this.clock()).toISOString();
  }

  recordFailure() {
    this.lastFailureAt = new Date(this.clock()).toISOString();

    if (this.state === STATE_HALF_OPEN) {
      this._open();
      return;
    }

    this.failureCount += 1;
    if (this.failureCount >= this.failureThreshold) {
      this._open();
    }
  }

  snapshot() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      failureThreshold: this.failureThreshold,
      cooldownMs: this.cooldownMs,
      openedAt: this.openedAt,
      lastFailureAt: this.lastFailureAt,
      lastSuccessAt: this.lastSuccessAt,
      halfOpenInFlight: this.halfOpenInFlight,
    };
  }

  _open() {
    this.state = STATE_OPEN;
    this.openedAt = new Date(this.clock()).toISOString();
    this.halfOpenInFlight = 0;
  }
}

export default CircuitBreaker;
