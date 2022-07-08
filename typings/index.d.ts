import { Readable } from "stream";

declare module "scdl-core" {
    export type StreamOptions = {
        strict?: boolean
        preset?: string
        protocol?: string
        mimeType?: string
        quality?: string
    };

    interface PublisherMetadata {
        id: number
        urn: string
        contains_music: boolean
        artist?: string
        isrc: string
        explicit: boolean
        writer_composer?: string
        release_title?: string
        album_title?: string
        upc_or_ean?: string
        p_line?: string
        p_line_for_display: string
        c_line: string
        c_line_for_display: string
        publisher?: string
        iswc?: string
    }

    interface UserBadges {
        pro: boolean
        pro_unlimited: boolean
        verified: boolean
    }

    interface CreatorSubscription {

    }

    interface Visual {
        urn: string
        entry_time: number
        visual_url: string
        link: string
    }

    interface Visuals {
        urn: string
        enabled: boolean
        visuals: Array<Visual>
        tracking?: any
    }

    interface UserInfo {
        avatar_url: string
        first_name?: string
        followers_count: number
        full_name?: string
        id: number
        kind: string
        last_modified: string
        last_name?: string
        permalink: string
        uri: string
        urn: string
        username: string
        verified: boolean
        city?: string
        country_code?: string
        badges: UserBadges
        station_urn: string
        station_permalink: string
        comments_count: number
        created_at: string
        creator_subscriptions: Array<any>
        creator_subscription: CreatorSubscription
        description?: string
        followings_count: number
        groups_count: number
        likes_count: number
        playlist_likes_count: number
        playlist_count: number
        reposts_count?: number
        track_count: number
        visuals?: Visuals
    }

    interface Transcoding {
        url: string
        preset: string
        duration: number
        snipped: boolean
        format: {
            protocol: string
            mime_type: string
        }
        quality: string
    }

    interface TrackMedia {
        transcodings: Array<Transcoding>
    }

    interface TrackInfo {
        artwork_url?: string
        caption?: string
        commentable: boolean
        comment_count?: number
        created_at: string
        description?: string
        downloadable: boolean
        download_count?: number
        duration: number
        full_duration: number
        embeddable_by: string
        genre?: string
        has_downloads_left: boolean
        id: number
        kind: string
        label_name?: string
        last_modified: string
        license: string
        likes_count?: number
        permalink: string
        permalink_url: string
        playback_count?: number
        public: boolean
        publisher_metadata?: PublisherMetadata
        purchase_title?: string
        purchase_url?: string
        release_date?: string
        reposts_count: number
        secret_token?: string
        sharing: string
        state: string
        streamable: boolean
        tag_list?: string
        title: string
        track_format: string
        uri: string
        urn: string
        user_id: number
        visuals?: Visuals
        waveform_url: string
        display_date: string
        media: TrackMedia
        station_urn: string
        station_permalink: string
        track_authorization: string
        monetization_model: string
        policy: string
        user: UserInfo
    }

    export interface StreamableTrackInfo {
        media: TrackMedia
    }

    interface PlaylistInfo {
        tracks: Array<TrackInfo>
    }

    export interface StreamablePlaylistInfo {
        tracks: Array<StreamableTrackInfo>
    }

    const scdl: {
        (url: string, options?: StreamOptions): Readable;

        clientID?: string;
        oauthToken?: string;

        setClientID(id: string): void;
        setOauthToken(token: string): void;
        awaitDownload(url: string, options?: StreamOptions): Promise<Readable>;
        getInfo(url: string): Promise<TrackInfo>;
        downloadFromInfo(info: StreamableTrackInfo, options?: StreamOptions): Readable;
        awaitDownloadFromInfo(info: StreamableTrackInfo, options?: StreamOptions): Promise<Readable>;
        validateURL(url: string): boolean;
        getPermalinkURL(url: string): string;
        playlist: {
            (url: string, options?: StreamOptions): Promise<Array<Readable> | null>;

            downloadFromInfo(info: StreamablePlaylistInfo, options?: StreamOptions): Promise<Array<Readable> | null>;
            validateURL(url: string): boolean;
            getPermalinkURL(url: string): string;
            getInfo(url: string): Promise<PlaylistInfo>;
        }
    }

    export = scdl;
}
