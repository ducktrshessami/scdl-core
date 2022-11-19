import { getInfo, StreamableTrackInfo } from "./info";
import {
    MimeType,
    Preset,
    Protocol,
    Quality
} from "./utils/transcoding";

const DEFAULT_OPTIONS: StreamOptions = {
    strict: false,
    preset: Preset.MP3,
    protocol: Protocol.PROGRESSIVE,
    mimeType: MimeType.MPEG,
    quality: Quality.SQ
};

/**
 * * Stream a track from its info object
 * 
 * Used internally by `stream`
 * @param info Info obtained from {@link getInfo}
 * @param options Transcoding search options
 */
export async function streamFromInfo(info: StreamableTrackInfo, options: StreamOptions = DEFAULT_OPTIONS) {

}

/**
 * Stream a track from its URL
 * @param url A track url
 * @param options Transcoding search options
 */
export async function stream(url: string, options: StreamOptions = DEFAULT_OPTIONS) {
    const info = await getInfo(url);
    return streamFromInfo(info, options);
}

export type StreamOptions = {
    /**
     * If `true`, will only stream if all specified options match a transcoding
     * 
     * If `false`, will stream most similar transcoding
     * 
     * Defaults to `false`
     */
    strict?: boolean,
    preset?: Preset,
    protocol?: Protocol,
    mimeType?: MimeType,
    quality?: Quality
};
