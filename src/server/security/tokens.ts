import "server-only";
import { createHash, randomBytes } from "node:crypto";

export const sha256Hex = (value: string): string => createHash("sha256").update(value).digest("hex");
export const randomToken = (bytes = 32): string => randomBytes(bytes).toString("base64url");
