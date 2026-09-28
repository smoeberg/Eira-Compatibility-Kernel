import type { CanonicalEntityBase, CanonicalId } from "./ids";

export interface CanonicalMailMessage extends CanonicalEntityBase {
  subject: string;
  from: CanonicalId;
  to: CanonicalId[];
  cc?: CanonicalId[];
  bodyText?: string;
  bodyHtml?: string;
  sentAt?: string;
  receivedAt?: string;
  isRead?: boolean;
}

export interface CanonicalMailbox extends CanonicalEntityBase {
  displayName: string;
  ownerId: CanonicalId;
}

export type CanonicalMailMessageCreate = Omit<
  CanonicalMailMessage,
  "id" | "externalRefs"
> & {
  id?: CanonicalMailMessage["id"];
  externalRefs?: CanonicalMailMessage["externalRefs"];
};
