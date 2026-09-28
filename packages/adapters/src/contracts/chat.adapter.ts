import type { CanonicalId } from "@eck/translation";
import type { AdapterContext, AdapterPlugin } from "./base";

/** Chat / realtime messaging — Matrix (V2). V1 uses webhook emulation. */
export interface IChatAdapter extends AdapterPlugin {
  readonly domain: "chat";
  sendMessage(
    ctx: AdapterContext,
    chatId: CanonicalId,
    body: string,
  ): Promise<{ messageId: string }>;
  listRooms(ctx: AdapterContext): Promise<Array<{ id: string; name: string }>>;
}

export const CHAT_ADAPTER = Symbol("IChatAdapter");
