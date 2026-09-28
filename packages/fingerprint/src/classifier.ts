import type { LogCategory } from "./types";

const IDENTITY_PREFIXES = ["/users", "/groups", "/me"];
const FILES_PREFIXES = ["/drive", "/files"];
const CALENDAR_PREFIXES = ["/events", "/calendars", "/me/events"];
const CHAT_PREFIXES = ["/chats", "/notifications"];

export function classifyPath(path: string): LogCategory {
  const normalized = path.split("?")[0] ?? path;

  if (CHAT_PREFIXES.some((p) => normalized.includes(p))) {
    return "chat_notify";
  }
  if (CALENDAR_PREFIXES.some((p) => normalized.startsWith(p))) {
    return "calendar";
  }
  if (FILES_PREFIXES.some((p) => normalized.startsWith(p))) {
    return "files";
  }
  if (IDENTITY_PREFIXES.some((p) => normalized.startsWith(p))) {
    return "identity";
  }
  return "other";
}

/** Normalize concrete paths to template form for matrix lookup. */
export function normalizePath(path: string): string {
  const withoutQuery = path.split("?")[0] ?? path;
  return withoutQuery
    .split("/")
    .map((segment) => {
      if (!segment) return segment;
      if (/^[0-9a-f-]{36}$/i.test(segment)) return "{id}";
      if (/^[0-9a-f]{24}$/i.test(segment)) return "{id}";
      if (/^\d+$/.test(segment)) return "{id}";
      return segment;
    })
    .join("/");
}
