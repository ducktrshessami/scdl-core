import { Readable } from "stream";

declare module "scdl-core" {
    type StreamOptions = {
        strict?: boolean
        preset?: string
        protocol?: string
        mimeType?: string
        quality?: string
    };

    interface PublisherMetadata {

    }

    interface UserInfo {

    }

    interface TrackMedia {

    }

    interface TrackInfo {
        artwork_url: string | null
        caption: string | null
        commentable: boolean
        comment_count: number | null
        created_at: string
        description: string | null
        downloadable: boolean
        download_count: number | null
        duration: number
        full_duration: number
        embeddable_by: string
        genre: string | null
        has_downloads_left: boolean
        id: number
        kind: string
        label_name: string | null
        last_modified: string
        license: string
        likes_count: number | null
        permalink: string
        permalink_url: string
        playback_count: number | null
        public: boolean
        publisher_metadata: PublisherMetadata | null
        purchase_title: string | null
        purchase_url: string | null
        release_date: string | null
        reposts_count: number
        secret_token: string | null
        sharing: string
        state: string
        streamable: boolean
        tag_list: string | null
        title: string
        track_format: string
        uri: string
        urn: string
        user_id: number
        visuals: any
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

    interface StreamableTrackInfo {

    }

    interface PlaylistInfo {
        tracks: Array<TrackInfo>
    }

    interface StreamablePlaylistInfo {
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
