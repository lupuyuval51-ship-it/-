/**
 * שכבת AI מרכזית: כל האפליקציה מדברת רק עם הממשק AiProvider.
 * כדי להחליף מודל או ספק (OpenAI, Gemini, מודל מקומי) מספיק לכתוב מימוש חדש ל-AiProvider ולבחור אותו ב-getProvider().
 */
export type AiContentPart =
  | { type: "text"; text: string }
  | { type: "image"; mediaType: string; data: string /* base64 ללא קידומת data: */ };

export interface AiMessage {
  role: "user" | "assistant";
  content: string | AiContentPart[];
}

export interface AiRequest {
  system: string;
  messages: AiMessage[];
  maxTokens: number;
  temperature?: number;
  signal?: AbortSignal;
}

export interface AiResult {
  text: string;
  usage?: { inputTokens: number; outputTokens: number };
}

export interface AiProvider {
  readonly name: string;
  readonly model: string;
  complete(req: AiRequest): Promise<AiResult>;
  stream(req: AiRequest): AsyncGenerator<string, void, void>;
}

export type AiErrorCode = "not_configured" | "unauthorized" | "rate_limited" | "overloaded" | "bad_request" | "network" | "bad_output" | "upstream" | "timeout";

export class AiError extends Error {
  constructor(
    public code: AiErrorCode,
    message: string,
    public status = 502,
  ) {
    super(message);
    this.name = "AiError";
  }
}

export const AI_ERROR_HE: Record<AiErrorCode, string> = {
  not_configured: "שירות ה-AI עדיין לא מחובר בשרת (חסר מפתח API).",
  unauthorized: "מפתח ה-API של שירות ה-AI אינו תקין או שפג תוקפו. יש לבדוק את ההגדרה בשרת.",
  rate_limited: "שולחים יותר מדי בקשות. נסה שוב בעוד רגע.",
  overloaded: "שירות ה-AI עמוס כרגע. נסה שוב בעוד כמה שניות.",
  bad_request: "הבקשה לא התקבלה על ידי שירות ה-AI. נסה לנסח אחרת או לקצר את החומר המצורף.",
  network: "לא הצלחנו להתחבר לשירות ה-AI. בדוק את החיבור לאינטרנט ונסה שוב.",
  bad_output: "ה-AI החזיר תשובה לא תקינה. נסה שוב.",
  upstream: "אירעה שגיאה בשירות ה-AI. נסה שוב.",
  timeout: "התשובה לוקחת יותר מדי זמן. נסה שוב.",
};
