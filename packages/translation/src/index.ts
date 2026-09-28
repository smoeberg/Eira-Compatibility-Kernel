export * from "./canonical";
export type {
  EiraCalendarEvent,
  EiraDriveItem,
  EiraEntity,
  EiraGroup,
  EiraGroupMember,
  EiraUser,
} from "./internal-model";

export type {
  PlatformPayload,
  RequestMapper,
  ResponseMapper,
  RouteMapper,
  TranslationRegistry,
} from "./mapper";
export type { TranslationContext } from "./context";

export type {
  BackendInboundMapper,
  BackendMapperPair,
  BackendOutboundMapper,
  BackendPayload,
} from "./backend/mapper";

export type {
  PlatformInboundMapper,
  PlatformMapperRegistry,
  PlatformOutboundMapper,
  PlatformRouteMapper,
} from "./platform/mapper";

export type { TranslationPipeline } from "./pipeline";

export { InMemoryTranslationRegistry } from "./registry";
export { InMemoryPlatformMapperRegistry } from "./platform/registry";

export {
  graphUserInbound,
  graphUserOutbound,
  type GraphUser,
} from "./platform/microsoft-graph/users.mapper";
