import { PlaylistInfo } from "./utils/playlist";
import { Transcoding } from "./utils/transcoding";
/**
 * Get a track's info
 */
export declare function getInfo(url: string): Promise<TrackInfo>;
/**
 * Get a playlist's info
 */
export declare function getPlaylistInfo(url: string): Promise<PlaylistInfo>;
export declare type TrackMedia = {
    transcodings: Array<Transcoding>;
};
export declare type DataWrapped<T> = {
    data: T;
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
