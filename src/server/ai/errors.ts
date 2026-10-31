export type ProviderErrorCode =
  | "PROVIDER_UNAVAILABLE"
  | "PROVIDER_TIMEOUT"
  | "PROVIDER_AUTH"
  | "PROVIDER_RATE_LIMITED"
  | "PROVIDER_REFUSED"
  | "PROVIDER_BAD_REQUEST"
  | "OUTPUT_TRUNCATED";

/**
 * Failure of a provider call. `message` is for logs only; `userMessage` is the safe text shown to the player.
 * Provider error bodies can echo request content or credentials, so they are never forwarded to clients.
 */
export class ProviderError extends Error {
  constructor(
    public readonly code: ProviderErrorCode,
    message: string,
    public readonly userMessage: string,
  ) {
    super(message);
    this.name = "ProviderError";
  }
}

export const USER_MESSAGES: Record<ProviderErrorCode, string> = {
  PROVIDER_UNAVAILABLE: "The AI service is temporarily unavailable. You were not charged — please try again in a few minutes.",
  PROVIDER_TIMEOUT: "The AI service took too long to respond. You were not charged — please try again.",
  PROVIDER_AUTH: "The AI service is not configured correctly on the server. You were not charged.",
  PROVIDER_RATE_LIMITED: "The AI service is busy right now. You were not charged — please try again shortly.",
  PROVIDER_REFUSED: "The AI service declined to create a game for this topic. You were not charged. Try rephrasing the subject.",
  PROVIDER_BAD_REQUEST: "The AI service rejected the request. You were not charged.",
  OUTPUT_TRUNCATED: "The AI response was cut off before it was complete. You were not charged — try a smaller game.",
};

export const providerError = (code: ProviderErrorCode, detail: string): ProviderError => new ProviderError(code, `${code}: ${detail}`, USER_MESSAGES[code]);
