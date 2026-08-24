import { rawResolve } from "./api";
import { ScdlError } from "./utils/error";
import { PlaylistInfo, PlaylistInfoData } from "./utils/playlist";
import { Transcoding } from "./utils/transcoding";
import { validatePlaylistURL, validateURL } from "./utils/validate";

/**
 * Get a track's info
 */
export async function getInfo(url: string): Promise<TrackInfo> {
    if (validateURL(url)) {
        const data: TrackInfoData = await rawResolve(url);
        return { data };
    }
    else {
        throw new ScdlError("Invalid track URL");
    }
}

/**
 * Get a playlist's info
 */
export async function getPlaylistInfo(url: string): Promise<PlaylistInfo> {
    if (validatePlaylistURL(url)) {
        const data: PlaylistInfoData = await rawResolve(url);
        return new PlaylistInfo(data);
    }
    else {
        throw new ScdlError("Invalid playlist URL");
    }
}

export interface TrackMedia {
    transcodings: Transcoding[];
}

export interface DataWrapped<T> {
    data: T;
}

export interface StreamableTrackInfoData {
    streamable?: boolean | null;
    media: TrackMedia;
}

export interface StreamableTrackInfo extends DataWrapped<StreamableTrackInfoData> { }

export interface PublisherMetadata {
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

export interface Visual {
    urn: string;
    entry_time: number;
    visual_url: string;
    link?: string | null;
}

export interface Visuals {
    urn: string;
    enabled: boolean;
    visuals: Visual[];
    /**
     * I have personally only seen this as `null`
     */
    tracking?: unknown | null;
}

export type UserBadges = Record<string, boolean>;

export interface CreatorSubscription {
    product: {
        id: string;
    };
}

export interface UserInfo {
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

export interface PartialTrackInfo {
    id: number;
    kind: string;
    monetization_model: string;
    policy: string;
}

export interface TrackInfoData {
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

export interface TrackInfo extends DataWrapped<TrackInfoData> { }
