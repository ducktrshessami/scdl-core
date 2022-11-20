import {
    PartialTrackInfo,
    TrackInfo,
    UserInfo
} from "../info";

export class PlaylistInfo {
    constructor(public readonly data: PlaylistInfoData) { }

    async fetchPartialTracks(): Promise<Array<TrackInfo>> {

    }
}

export type PlaylistInfoData = {
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
    tracks: Array<TrackInfo | PartialTrackInfo>
    track_count: number
};
