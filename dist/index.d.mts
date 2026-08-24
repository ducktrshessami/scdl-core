import { Dispatcher } from "undici";
import { PassThrough, Readable } from "stream";
//#region src/api.d.ts
/**
 * Resolve info from a URL
 */
declare function rawResolve(url: string): Promise<any>;
//#endregion
//#region src/auth.d.ts
/**
 * Set the client_id to access the API with
 */
declare function setClientID(id: string | null): void;
/**
 * Set the oauth_token to access the API with
 *
 * This will be prioritized over a client_id
 */
declare function setOauthToken(token: string | null): void;
/**
 * Get the currently set client_id
 */
declare function getClientID(): string | null;
/**
 * Get the currently set oauth_token
 */
declare function getOauthToken(): string | null;
//#endregion
//#region src/utils/playlist.d.ts
declare class PlaylistInfo<fetched extends boolean = boolean> {
  readonly data: PlaylistInfoData<fetched>;
  constructor(data: PlaylistInfoData<fetched>);
  /**
   * Checks if all track data has been fetched
   */
  isFetched(): this is PlaylistInfo<true>;
  /**
   * Fetches any partial track data in this playlist
   */
  fetchPartialTracks(): Promise<PlaylistInfo<true>>;
  /**
   * Stream tracks from this playlist
   *
   * Fetches partial track data first
   */
  stream(): Promise<Array<TrackStream | null>>;
}
interface PlaylistInfoData<fetched extends boolean = boolean> {
  artwork_url?: string | null;
  created_at: string;
  description?: string | null;
  duration: number;
  embeddable_by: string;
  genre?: string | null;
  id: number;
  kind: string;
  label_name?: string | null;
  last_modified: string;
  license: string;
  likes_count: number;
  managed_by_feeds: boolean;
  permalink: string;
  permalink_url: string;
  public: boolean;
  purchase_title?: string | null;
  purchase_url?: string | null;
  release_date?: string | null;
  reposts_count: number;
  secret_token?: string | null;
  sharing: string;
  tag_list?: string | null;
  title: string;
  uri: string;
  user_id: number;
  set_type?: string | null;
  is_album: boolean;
  published_at?: string | null;
  display_date: string;
  user: UserInfo;
  tracks: fetched extends true ? TrackInfoData[] : Array<TrackInfoData | PartialTrackInfo>;
  track_count: number;
}
interface StreamablePlaylistInfoData {
  tracks: StreamableTrackInfoData[];
}
interface StreamablePlaylistInfo extends DataWrapped<StreamablePlaylistInfoData> {}
//#endregion
//#region src/utils/transcoding.d.ts
/**
 * DISCLAIMER: This should not be considered comprehensive.
 * These are simply common values.
 */
declare enum Protocol {
  PROGRESSIVE = "progressive",
  HLS = "hls"
}
/**
 * I've only seen `sq` and `lq`, but I'm assuming there's a higher quality
 * for SoundCloud Go+ subscribers
 */
declare enum Quality {
  SQ = "sq",
  LQ = "lq"
}
type Preset = `${string}_${string}`;
type MimeType = `audio/${string}`;
interface Transcoding {
  url: string;
  preset: Preset;
  duration: number;
  snipped: boolean;
  format: {
    protocol: string;
    mime_type: MimeType;
  };
  quality: string;
  is_legacy_transcoding: boolean;
}
//#endregion
//#region src/info.d.ts
/**
 * Get a track's info
 */
declare function getInfo(url: string): Promise<TrackInfo>;
/**
 * Get a playlist's info
 */
declare function getPlaylistInfo(url: string): Promise<PlaylistInfo>;
interface TrackMedia {
  transcodings: Transcoding[];
}
interface DataWrapped<T> {
  data: T;
}
interface StreamableTrackInfoData {
  streamable?: boolean | null;
  media: TrackMedia;
}
interface StreamableTrackInfo extends DataWrapped<StreamableTrackInfoData> {}
interface PublisherMetadata {
  id: number;
  urn: string;
  contains_music?: boolean | null;
  artist?: string | null;
  isrc?: string | null;
  explicit?: boolean | null;
  writer_composer?: string | null;
  release_title?: string | null;
  album_title?: string | null;
  upc_or_ean?: string | null;
  p_line?: string | null;
  p_line_for_display?: string | null;
  c_line?: string | null;
  c_line_for_display?: string | null;
  publisher?: string | null;
  iswc?: string | null;
}
interface Visual {
  urn: string;
  entry_time: number;
  visual_url: string;
  link?: string | null;
}
interface Visuals {
  urn: string;
  enabled: boolean;
  visuals: Visual[];
  /**
   * I have personally only seen this as `null`
   */
  tracking?: unknown | null;
}
type UserBadges = Record<string, boolean>;
interface CreatorSubscription {
  product: {
    id: string;
  };
}
interface UserInfo {
  avatar_url: string;
  date_of_birth?: string | null;
  first_name?: string | null;
  followers_count: number;
  full_name?: string | null;
  id: number;
  kind: string;
  last_modified: string;
  last_name?: string | null;
  permalink: string;
  permalink_url: string;
  uri: string;
  urn: string;
  username: string;
  verified: boolean;
  city?: string | null;
  country_code?: string | null;
  badges: UserBadges;
  station_urn: string;
  station_permalink: string;
  comments_count?: number | null;
  created_at?: string | null;
  creator_subscriptions?: CreatorSubscription[] | null;
  creator_subscription?: CreatorSubscription | null;
  description?: string | null;
  followings_count?: number | null;
  groups_count?: number | null;
  likes_count?: number | null;
  playlist_likes_count?: number | null;
  playlist_count?: number | null;
  reposts_count?: number | null;
  track_count?: number | null;
  visuals?: Visuals | null;
}
interface PartialTrackInfo {
  id: number;
  kind: string;
  monetization_model: string;
  policy: string;
}
interface TrackInfoData {
  artwork_url?: string | null;
  caption?: string | null;
  commentable: boolean;
  comment_count?: number | null;
  created_at: string;
  description?: string | null;
  downloadable: boolean;
  download_count?: number | null;
  duration: number;
  full_duration: number;
  embeddable_by: string;
  genre?: string | null;
  has_downloads_left: boolean;
  id: number;
  kind: string;
  label_name?: string | null;
  last_modified: string;
  license: string;
  likes_count?: number | null;
  permalink: string;
  permalink_url: string;
  playback_count?: number | null;
  public: boolean;
  publisher_metadata?: PublisherMetadata | null;
  purchase_title?: string | null;
  purchase_url?: string | null;
  release_date?: string | null;
  reposts_count: number;
  secret_token?: string | null;
  sharing: string;
  state: string;
  streamable: boolean;
  tag_list?: string | null;
  title: string;
  track_format?: string | null;
  uri: string;
  urn: string;
  user_id: number;
  visuals?: Visuals | null;
  waveform_url: string;
  display_date: string;
  media: TrackMedia;
  station_urn: string;
  station_permalink: string;
  track_authorization: string;
  monetization_model: string;
  policy: string;
  user: UserInfo;
}
interface TrackInfo extends DataWrapped<TrackInfoData> {}
//#endregion
//#region src/utils/partial.d.ts
/**
 * Checks if all track data in a playlist has been fetched
 */
declare function isPlaylistFetched(info: FetchablePlaylistInfo): info is StreamablePlaylistInfo & FetchablePlaylistInfo;
/**
 * Fetches any partial track data in a playlist's info object
 *
 * Track info is updated in place
 * @param info Info obtained from `getPlaylistInfo`
 * @returns The updated playlist info object
 */
declare function fetchPartialPlaylist(info: FetchablePlaylistInfo): Promise<StreamablePlaylistInfo>;
interface MinimalTrackInfo {
  id: number;
}
interface FetchablePlaylistInfoData {
  tracks: Array<TrackInfoData | MinimalTrackInfo>;
}
interface FetchablePlaylistInfo extends DataWrapped<FetchablePlaylistInfoData> {}
//#endregion
//#region src/stream.d.ts
/**
 * * Stream a track from its info object
 *
 * Used internally by `stream`
 * @param info Info obtained from `getInfo`
 * @param options Transcoding search options
 */
declare function streamFromInfo(info: StreamableTrackInfo, options?: StreamOptions): Promise<TrackStream>;
/**
 * Stream a track from its URL
 * @param url A track URL
 * @param options Transcoding search options
 */
declare function stream(url: string, options?: StreamOptions): Promise<TrackStream>;
/**
 * Synchronously stream a track from its URL
 * @param url A track URL
 * @param options Transcoding search options
 */
declare function streamSync(url: string, options?: StreamOptions): TrackStream;
/**
 * Synchronously stream a track from its info object
 * @param info Info obtained from `getInfo`
 * @param options Transcoding search options
 */
declare function streamFromInfoSync(info: StreamableTrackInfo, options?: StreamOptions): TrackStream;
/**
 * Stream tracks from a playlist's info object
 *
 * Fetches partial track data before streaming
 *
 * Used internally by `streamPlaylist` and `PlaylistInfo.stream`
 * @param info Info obtained from `getPlaylistInfo`
 * @param options Transcoding search options
 * @returns A promise that resolves in an array. Each item will be either a readable stream or `null` if streaming errored
 */
declare function streamPlaylistFromInfo(info: StreamablePlaylistInfo | FetchablePlaylistInfo, options?: StreamOptions): Promise<Array<TrackStream | null>>;
/**
 * Stream tracks from a playlist's URL
 * @param url A playlist URL
 * @param options Transcoding search options
 * @returns A promise that resolves in an array. Each item will be either a readable stream or `null` if streaming errored
 */
declare function streamPlaylist(url: string, options?: StreamOptions): Promise<Array<TrackStream | null>>;
/**
 * Synchronously stream tracks from a playlist's info object
 * @param info Info obtained from `getPlaylistInfo`
 * @param options Transcoding search options
 */
declare function streamPlaylistFromInfoSync(info: StreamablePlaylistInfo, options?: StreamOptions): TrackStream[];
interface TranscodingOptions {
  preset: Transcoding["preset"];
  protocol: Transcoding["format"]["protocol"];
  mimeType: Transcoding["format"]["mime_type"];
  quality: Transcoding["quality"];
}
type StreamOptions = Partial<TranscodingOptions> & {
  /**
   * If `true`, will only stream if all specified options match a transcoding
   *
   * If `false`, will stream most similar transcoding
   *
   * Defaults to `false`
   */
  strict?: boolean;
};
type EventListenerArgs<EventMap extends {}, Event extends keyof EventMap> = EventMap[Event] extends any[] ? EventMap[Event] : [EventMap[Event]];
interface Emitter<EventMap extends {}> {
  emit<Event extends keyof EventMap>(event: Event, ...args: EventListenerArgs<EventMap, Event>): boolean;
  addListener<Event extends keyof EventMap>(event: Event, listener: (...args: EventListenerArgs<EventMap, Event>) => any): this;
  on<Event extends keyof EventMap>(event: Event, listener: (...args: EventListenerArgs<EventMap, Event>) => any): this;
  once<Event extends keyof EventMap>(event: Event, listener: (...args: EventListenerArgs<EventMap, Event>) => any): this;
  prependListener<Event extends keyof EventMap>(event: Event, listener: (...args: EventListenerArgs<EventMap, Event>) => any): this;
  prependOnceListener<Event extends keyof EventMap>(event: Event, listener: (...args: EventListenerArgs<EventMap, Event>) => any): this;
  removeListener<Event extends keyof EventMap>(event: Event, listener: (...args: EventListenerArgs<EventMap, Event>) => any): this;
  off(event: keyof EventMap, listener: (...args: any[]) => any): this;
}
interface TranscodingStreamEvents {
  transcoding: [Transcoding];
  connect: [];
}
interface BaseTranscodingStream extends Emitter<TranscodingStreamEvents> {
  transcoding?: Transcoding;
}
type TrackStream = BaseTranscodingStream & Readable;
//#endregion
//#region src/dispatch.d.ts
/**
 * Set the agent to use for requests
 *
 * Defaults to the global dispatcher
 */
declare function setAgent(agent: Dispatcher): void;
/**
 * Get the currently set agent
 */
declare function getAgent(): Dispatcher;
/**
 * Set the timeout for requests in milliseconds
 *
 * Defaults to 30000 ms
 */
declare function setRequestTimeout(timeout: number): void;
/**
 * Get the timeout for requests in milliseconds
 */
declare function getRequestTimeout(): number;
//#endregion
//#region src/queue.d.ts
/**
 * Set the limit for concurrent requests
 *
 * Defaults to 20
 */
declare function setRequestQueueLimit(limit: number): void;
/**
 * Get the limit for concurrent requests
 */
declare function getRequestQueueLimit(): number;
//#endregion
//#region src/utils/permalink.d.ts
/**
 * Formats a URL as a track's permalink URL
 */
declare function getPermalinkURL(url: string): string;
/**
 * Formats a URL as a playlist's permalink URL
 */
declare function getPlaylistPermalinkURL(url: string): string;
//#endregion
//#region src/utils/validate.d.ts
/**
 * A regular expression that matches SoundCloud track URLs
 *
 * Includes the `user`, `title`, and `secret` groups
 */
declare const TrackURLPattern: RegExp;
/**
 * A regular expression that matches SoundCloud playlist URLs
 *
 * Includes the `user`, `title`, and `secret` groups
 */
declare const PlaylistURLPattern: RegExp;
/**
 * Checks if a string matches the SoundCloud track URL format
 */
declare function validateURL(url: string): boolean;
/**
 * Checks if a string matches the SoundCloud playlist URL format
 */
declare function validatePlaylistURL(url: string): boolean;
//#endregion
export { type CreatorSubscription, FetchablePlaylistInfo, FetchablePlaylistInfoData, MimeType, MinimalTrackInfo, type PartialTrackInfo, type PlaylistInfo, type PlaylistInfoData, PlaylistURLPattern, Preset, Protocol, type PublisherMetadata, Quality, type StreamOptions, type StreamablePlaylistInfo, type StreamableTrackInfo, type StreamableTrackInfoData, type TrackInfo, type TrackInfoData, type TrackMedia, type TrackStream, TrackURLPattern, Transcoding, type UserBadges, type UserInfo, type Visual, type Visuals, fetchPartialPlaylist, getAgent, getClientID, getInfo, getOauthToken, getPermalinkURL, getPlaylistInfo, getPlaylistPermalinkURL, getRequestQueueLimit, getRequestTimeout, isPlaylistFetched, rawResolve, setAgent, setClientID, setOauthToken, setRequestQueueLimit, setRequestTimeout, stream, streamFromInfo, streamFromInfoSync, streamPlaylist, streamPlaylistFromInfo, streamPlaylistFromInfoSync, streamSync, validatePlaylistURL, validateURL };
//# sourceMappingURL=index.d.mts.map