import type { CanonicalEntityBase, CanonicalId } from "./ids";

export interface CanonicalIdentity extends CanonicalEntityBase {
  userId: CanonicalId;
  provider: string;
  subject: string;
  enabled: boolean;
}

export type CanonicalIdentityCreate = Omit<CanonicalIdentity, "id" | "externalRefs"> & {
  id?: CanonicalId;
  externalRefs?: CanonicalIdentity["externalRefs"];
};
