import {
    DataWrapped,
    PartialTrackInfo,
    StreamableTrackInfoData,
    TrackInfoData,
    UserInfo
} from "../info";
import { TrackStream, streamPlaylistFromInfo } from "../stream";
import { fetchPartialPlaylist, isPlaylistFetched } from "./partial";

export class PlaylistInfo<fetched extends boolean = boolean> {
    constructor(public readonly data: PlaylistInfoData<fetched>) { }

    /**
     * Checks if all track data has been fetched
     */
    isFetched(): this is PlaylistInfo<true> {
        return isPlaylistFetched(this);
    }

    /**
     * Fetches any partial track data in this playlist
     */
    async fetchPartialTracks(): Promise<PlaylistInfo<true>> {
        await fetchPartialPlaylist(this);
        return this as PlaylistInfo<true>;
    }

    /**
     * Stream tracks from this playlist
     * 
     * Fetches partial track data first
     */
    async stream(): Promise<Array<TrackStream | null>> {
        return streamPlaylistFromInfo(this);
    }
}

export interface PlaylistInfoData<fetched extends boolean = boolean> {
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

export interface StreamablePlaylistInfoData {
    tracks: StreamableTrackInfoData[];
}

export interface StreamablePlaylistInfo extends DataWrapped<StreamablePlaylistInfoData> { }
