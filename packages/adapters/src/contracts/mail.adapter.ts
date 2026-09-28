import type {
  CanonicalId,
  CanonicalMailMessage,
  CanonicalMailMessageCreate,
  CanonicalMailbox,
} from "@eck/translation";
import type { AdapterContext, AdapterPlugin } from "./base";

export interface IMailAdapter extends AdapterPlugin {
  readonly domain: "mail";
  getMessage(
    ctx: AdapterContext,
    id: CanonicalId,
  ): Promise<CanonicalMailMessage>;
  listMessages(
    ctx: AdapterContext,
    mailboxId: CanonicalId,
  ): Promise<CanonicalMailMessage[]>;
  sendMessage(
    ctx: AdapterContext,
    payload: CanonicalMailMessageCreate,
  ): Promise<CanonicalMailMessage>;
  deleteMessage(ctx: AdapterContext, id: CanonicalId): Promise<void>;
  getMailbox(ctx: AdapterContext, id: CanonicalId): Promise<CanonicalMailbox>;
}

export const MAIL_ADAPTER = Symbol("IMailAdapter");
