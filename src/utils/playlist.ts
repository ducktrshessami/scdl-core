import { rawResolve } from "../api";
import {
    DataWrapped,
    PartialTrackInfo,
    StreamableTrackInfo,
    TrackInfo,
    UserInfo
} from "../info";
import { streamPlaylistFromInfo, TrackStream } from "../stream";

/**
 * Creates a track URI from a track's id
 * @param id The track's id
 */
function trackURI(id: number): string {
    return `https://api.soundcloud.com/tracks/${id}`;
}

export class PlaylistInfo<fetched extends boolean = boolean> {
    constructor(public readonly data: PlaylistInfoData<fetched>) { }

    /**
     * Checks if all track data has been fetched
     */
    isFetched(): this is PlaylistInfo<true> {
        return this.data.tracks.every((track: any) => track.media);
    }

    /**
     * Fetches any partial track data in this playlist
     */
    async fetchPartialTracks(): Promise<PlaylistInfo<true>> {
        this.data.tracks = await Promise.all(
            this.data.tracks.map(async (track: any): Promise<TrackInfo> => {
                if (track.media) {
                    return track;
                }
                else {
                    const info: TrackInfo = await rawResolve(trackURI(track.id));
                    return info;
                }
            })
        );
        return this as PlaylistInfo<true>;
    }

    /**
     * Stream tracks from this playlist
     * 
     * Fetches partial track data first
     */
    async stream(): Promise<Array<TrackStream | null>> {
        await this.fetchPartialTracks();
        return streamPlaylistFromInfo(this as PlaylistInfo<true>);
    }
}

export type PlaylistInfoData<fetched extends boolean = boolean> = {
    artwork_url?: string
    created_at: string
    description?: string
    duration: number
    embeddable_by: string
    genre?: string
    id: number
    kind: string
    label_name?: string
    last_modified: string
    license: string
    likes_count: number
    managed_by_feeds: boolean
    permalink: string
    permalink_url: string
    public: boolean
    purchase_title?: string
    purchase_url?: string
    release_date?: string
    reposts_count: number
    secret_token?: string
    sharing: string
    tag_list?: string
    title: string
    uri: string
    user_id: number
    set_type?: string
    is_album: boolean
    published_at?: string
    display_date: string
    user: UserInfo
    tracks: fetched extends true ? Array<TrackInfo> : Array<TrackInfo | PartialTrackInfo>
    track_count: number
};

export type StreamablePlaylistInfoData = {
    tracks: Array<StreamableTrackInfo>
};

export type StreamablePlaylistInfo = DataWrapped<StreamablePlaylistInfoData>;
