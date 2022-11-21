/// <reference types="node" />
import { Readable } from "stream";
import { StreamableTrackInfo } from "./info";
import { FetchablePlaylistInfo } from "./utils/partial";
import { StreamablePlaylistInfo } from "./utils/playlist";
import { MimeType, Preset, Protocol, Quality, Transcoding } from "./utils/transcoding";
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
export {};
