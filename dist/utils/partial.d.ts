import { DataWrapped, TrackInfoData } from "../info";
import { StreamablePlaylistInfo } from "./playlist";
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
