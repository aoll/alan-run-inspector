// Domain errors thrown by the DAL and the services; entries translate them into UI or HTTP outcomes.
export class UnauthorizedError extends Error {
  constructor() {
    super("Unauthorized");
    this.name = "UnauthorizedError";
  }
}

export class NotFoundError extends Error {
  constructor(what: string) {
    super(`${what} not found`);
    this.name = "NotFoundError";
  }
}

export class RateLimitedError extends Error {
  constructor() {
    super("Rate limited");
    this.name = "RateLimitedError";
  }
}
