import type {
  CanonicalCalendarEvent,
  CanonicalCalendarEventCreate,
  CanonicalCalendarEventPatch,
  CanonicalId,
} from "@eck/translation";
import type { AdapterContext, AdapterPlugin } from "./base";

export interface ICalendarAdapter extends AdapterPlugin {
  readonly domain: "calendar";
  getEvent(
    ctx: AdapterContext,
    id: CanonicalId,
  ): Promise<CanonicalCalendarEvent>;
  listEvents(
    ctx: AdapterContext,
    calendarId?: CanonicalId,
  ): Promise<CanonicalCalendarEvent[]>;
  createEvent(
    ctx: AdapterContext,
    payload: CanonicalCalendarEventCreate,
  ): Promise<CanonicalCalendarEvent>;
  updateEvent(
    ctx: AdapterContext,
    id: CanonicalId,
    patch: CanonicalCalendarEventPatch,
  ): Promise<CanonicalCalendarEvent>;
  deleteEvent(ctx: AdapterContext, id: CanonicalId): Promise<void>;
}

export const CALENDAR_ADAPTER = Symbol("ICalendarAdapter");
