export class ProviderRateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProviderRateLimitError';
  }
}

export class ProviderAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProviderAuthError';
  }
}

export class ProviderTimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProviderTimeoutError';
  }
}

export class ProviderInvalidResponseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProviderInvalidResponseError';
  }
}

export class MalformedOutputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MalformedOutputError';
  }
}
