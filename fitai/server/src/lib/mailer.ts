/**
 * Transactional email adapter. No email provider is bundled (none was configured), so the
 * default transport logs messages in development and drops them (with a warning) in
 * production. Plug a provider in by calling `setMailTransport` at startup — see README.
 */
import { config } from '../config';

export interface MailMessage {
  to: string;
  subject: string;
  text: string;
}

export type MailTransport = (msg: MailMessage) => Promise<void>;

const defaultTransport: MailTransport = async (msg) => {
  if (config.isTest) return;
  if (config.isProduction) {
    console.warn(`[mail] no email provider configured — message "${msg.subject}" was not delivered`);
    return;
  }
  console.log(`[mail:dev] to=${msg.to} subject="${msg.subject}"\n${msg.text}`);
};

let transport: MailTransport = defaultTransport;

export function setMailTransport(t: MailTransport | null) {
  transport = t ?? defaultTransport;
}

export async function sendMail(msg: MailMessage) {
  try {
    await transport(msg);
  } catch (err) {
    console.error('[mail] send failed', (err as Error).message);
  }
}
