import type { CanonicalEntityBase, CanonicalId, IsoDateTime } from "./ids";

export interface CanonicalCalendarEvent extends CanonicalEntityBase {
  title: string;
  startsAt: IsoDateTime;
  endsAt: IsoDateTime;
  organizerId?: CanonicalId;
  attendeeIds?: CanonicalId[];
  location?: string;
}

export type CanonicalCalendarEventCreate = Omit<CanonicalCalendarEvent, "id" | "externalRefs"> & {
  id?: CanonicalId;
  externalRefs?: CanonicalCalendarEvent["externalRefs"];
};

export type CanonicalCalendarEventPatch = Partial<Pick<CanonicalCalendarEvent,
  "title" | "startsAt" | "endsAt" | "organizerId" | "attendeeIds" | "location">>;
