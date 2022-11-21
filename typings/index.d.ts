/// <reference types="node" />
import { Readable } from "stream";
import { Dispatcher } from "undici";

/**
 * Resolve info from a URL
 */
export declare function rawResolve(url: string): Promise<any>;

/**
 * Set the client_id to access the API with
 */
export declare function setClientID(id: string | null): void;
/**
 * Set the oauth_token to access the API with
 *
 * This will be prioritized over a client_id
 */
export declare function setOauthToken(token: string | null): void;
/**
 * Get the currently set client_id
 */
export declare function getClientID(): string | null;
/**
 * Get the currently set oauth_token
 */
export declare function getOauthToken(): string | null;

/**
 * Set the agent to use for requests
 *
 * Defaults to the global dispatcher
 */
export declare function setAgent(agent: Dispatcher): void;
/**
 * Get the currently set agent
 */
export declare function getAgent(): Dispatcher;
/**
 * Set the timeout for requests in milliseconds
 *
 * Defaults to 30000 ms
 */
export declare function setRequestTimeout(timeout: number): void;
/**
 * Get the timeout for requests in milliseconds
 */
export declare function getRequestTimeout(): number;
/**
 * Set the limit for concurrent requests
 *
 * Defaults to 50
 */
export declare function setRequestQueueLimit(limit: number): void;
/**
 * Get the limit for concurrent requests
 */
export declare function getRequestQueueLimit(): number;

/**
 * Get a track's info
 */
export declare function getInfo(url: string): Promise<TrackInfo>;
/**
 * Get a playlist's info
 */
export declare function getPlaylistInfo(url: string): Promise<PlaylistInfo>;
declare type DataWrapped<T> = {
    data: T;
};
export declare type TrackMedia = {
    transcodings: Array<Transcoding>;
};
export declare type StreamableTrackInfoData = {
    streamable?: boolean;
    media: TrackMedia;
};
export declare type StreamableTrackInfo = DataWrapped<StreamableTrackInfoData>;
export declare type PublisherMetadata = {
    id: number;
    urn: string;
    contains_music?: boolean;
    artist?: string;
    isrc?: string;
    explicit?: boolean;
    writer_composer?: string;
    release_title?: string;
    album_title?: string;
    upc_or_ean?: string;
    p_line?: string;
    p_line_for_display?: string;
    c_line?: string;
    c_line_for_display?: string;
    publisher?: string;
    iswc?: string;
};
export declare type Visual = {
    urn: string;
    entry_time: number;
    visual_url: string;
    link: string;
};
export declare type Visuals = {
    urn: string;
    enabled: boolean;
    visuals: Array<Visual>;
    /**
     * I have personally only seen this as `null`
     */
    tracking?: any;
};
export declare type UserBadges = {
    pro: boolean;
    pro_unlimited: boolean;
    verified: boolean;
};
export declare type CreatorSubscription = {
    product: {
        id: string;
    };
};
export declare type UserInfo = {
    avatar_url: string;
    first_name?: string;
    followers_count: number;
    full_name?: string;
    id: number;
    kind: string;
    last_modified: string;
    last_name?: string;
    permalink: string;
    uri: string;
    urn: string;
    username: string;
    verified: boolean;
    city?: string;
    country_code?: string;
    badges: UserBadges;
    station_urn: string;
    station_permalink: string;
    comments_count?: number;
    created_at?: string;
    creator_subscriptions?: Array<CreatorSubscription>;
    creator_subscription?: CreatorSubscription;
    description?: string;
    followings_count?: number;
    groups_count?: number;
    likes_count?: number;
    playlist_likes_count?: number;
    playlist_count?: number;
    reposts_count?: number;
    track_count?: number;
    visuals?: Visuals;
};
export declare type PartialTrackInfo = {
    id: number;
    kind: string;
    monetization_model: string;
    policy: string;
};
export declare type TrackInfoData = {
    artwork_url?: string;
    caption?: string;
    commentable: boolean;
    comment_count?: number;
    created_at: string;
    description?: string;
    downloadable: boolean;
    download_count?: number;
    duration: number;
    full_duration: number;
    embeddable_by: string;
    genre?: string;
    has_downloads_left: boolean;
    id: number;
    kind: string;
    label_name?: string;
    last_modified: string;
    license: string;
    likes_count?: number;
    permalink: string;
    permalink_url: string;
    playback_count?: number;
    public: boolean;
    publisher_metadata?: PublisherMetadata;
    purchase_title?: string;
    purchase_url?: string;
    release_date?: string;
    reposts_count: number;
    secret_token?: string;
    sharing: string;
    state: string;
    streamable: boolean;
    tag_list?: string;
    title: string;
    track_format: string;
    uri: string;
    urn: string;
    user_id: number;
    visuals?: Visuals;
    waveform_url: string;
    display_date: string;
    media: TrackMedia;
    station_urn: string;
    station_permalink: string;
    track_authorization: string;
    monetization_model: string;
    policy: string;
    user: UserInfo;
};
export declare type TrackInfo = DataWrapped<TrackInfoData>;

/**
 * * Stream a track from its info object
 *
 * Used internally by `stream`
 * @param info Info obtained from `getInfo`
 * @param options Transcoding search options
 */
export declare function streamFromInfo(info: StreamableTrackInfo, options?: StreamOptions): Promise<TrackStream>;
/**
 * Stream a track from its URL
 * @param url A track URL
 * @param options Transcoding search options
 */
export declare function stream(url: string, options?: StreamOptions): Promise<TrackStream>;
/**
 * Synchronously stream a track from its URL
 * @param url A track URL
 * @param options Transcoding search options
 */
export declare function streamSync(url: string, options?: StreamOptions): TrackStream;
/**
 * Synchronously stream a track from its info object
 * @param info Info obtained from `getInfo`
 * @param options Transcoding search options
 */
export declare function streamFromInfoSync(info: StreamableTrackInfo, options?: StreamOptions): TrackStream;
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
export declare function streamPlaylistFromInfo(info: StreamablePlaylistInfo | FetchablePlaylistInfo, options?: StreamOptions): Promise<Array<TrackStream | null>>;
/**
 * Stream tracks from a playlist's URL
 * @param url A playlist URL
 * @param options Transcoding search options
 * @returns A promise that resolves in an array. Each item will be either a readable stream or `null` if streaming errored
 */
export declare function streamPlaylist(url: string, options?: StreamOptions): Promise<Array<TrackStream | null>>;
/**
 * Synchronously stream tracks from a playlist's info object
 * @param info Info obtained from `getPlaylistInfo`
 * @param options Transcoding search options
 */
export declare function streamPlaylistFromInfoSync(info: StreamablePlaylistInfo, options?: StreamOptions): Array<TrackStream>;
export declare type StreamOptions = {
    /**
     * If `true`, will only stream if all specified options match a transcoding
     *
     * If `false`, will stream most similar transcoding
     *
     * Defaults to `false`
     */
    strict?: boolean;
    preset?: Preset;
    protocol?: Protocol;
    mimeType?: MimeType;
    quality?: Quality;
};
interface StreamingTranscoding {
    transcoding?: Transcoding;
    on(event: "transcoding", listener: (transcoding: Transcoding) => void): this;
    on(event: "connect", listener: () => void): this;
}
export declare type TrackStream = Readable & StreamingTranscoding;

/**
 * Checks if all track data in a playlist has been fetched
 */
export declare function isPlaylistFetched(info: FetchablePlaylistInfo): info is StreamablePlaylistInfo & FetchablePlaylistInfo;
/**
 * Fetches any partial track data in a playlist's info object
 *
 * Track info is updated in place
 * @param info Info obtained from `getPlaylistInfo`
 * @returns The updated playlist info object
 */
export declare function fetchPartialPlaylist(info: FetchablePlaylistInfo): Promise<StreamablePlaylistInfo>;
export declare type MinimalTrackInfo = {
    id: number;
};
export declare type FetchablePlaylistInfoData = {
    tracks: Array<TrackInfoData | MinimalTrackInfo>;
};
export declare type FetchablePlaylistInfo = DataWrapped<FetchablePlaylistInfoData>;

/**
 * Formats a URL as a track's permalink URL
 */
export declare function getPermalinkURL(url: string): string;
/**
 * Formats a URL as a playlist's permalink URL
 */
export declare function getPlaylistPermalinkURL(url: string): string;

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
export type { PlaylistInfo }
export declare type PlaylistInfoData<fetched extends boolean = boolean> = {
    artwork_url?: string;
    created_at: string;
    description?: string;
    duration: number;
    embeddable_by: string;
    genre?: string;
    id: number;
    kind: string;
    label_name?: string;
    last_modified: string;
    license: string;
    likes_count: number;
    managed_by_feeds: boolean;
    permalink: string;
    permalink_url: string;
    public: boolean;
    purchase_title?: string;
    purchase_url?: string;
    release_date?: string;
    reposts_count: number;
    secret_token?: string;
    sharing: string;
    tag_list?: string;
    title: string;
    uri: string;
    user_id: number;
    set_type?: string;
    is_album: boolean;
    published_at?: string;
    display_date: string;
    user: UserInfo;
    tracks: fetched extends true ? Array<TrackInfoData> : Array<TrackInfoData | PartialTrackInfo>;
    track_count: number;
};
export declare type StreamablePlaylistInfoData = {
    tracks: Array<StreamableTrackInfoData>;
};
export declare type StreamablePlaylistInfo = DataWrapped<StreamablePlaylistInfoData>;

export declare enum Preset {
    MP3 = "mp3_0_1",
    OPUS = "opus_0_0"
}
export declare enum Protocol {
    PROGRESSIVE = "progressive",
    HLS = "hls"
}
export declare enum MimeType {
    MPEG = "audio/mpeg",
    OPUS = "audio/ogg; codecs=\"opus\""
}
export declare enum Quality {
    SQ = "sq",
    /**
     * I've only seen `sq`, but I'm assuming something like this exists
     * for SoundCloud Go+ subscribers
     */
    HQ = "hq"
}
export declare type Transcoding = {
    url: string;
    preset: Preset;
    duration: number;
    snipped: boolean;
    format: {
        protocol: Protocol;
        mime_type: MimeType;
    };
    quality: Quality;
};

/**
 * A regular expression that matches SoundCloud track URLs
 *
 * Includes the `user`, `title`, and `secret` groups
 */
export declare const TrackURLPattern: RegExp;
/**
 * A regular expression that matches SoundCloud playlist URLs
 *
 * Includes the `user`, `title`, and `secret` groups
 */
export declare const PlaylistURLPattern: RegExp;
/**
 * Checks if a string matches the SoundCloud track URL format
 */
export declare function validateURL(url: string): boolean;
/**
 * Checks if a string matches the SoundCloud playlist URL format
 */
export declare function validatePlaylistURL(url: string): boolean;
