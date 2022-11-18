import { StreamableTrackInfo } from "./info";
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
 * Stream a track from its info object
 */
export async function streamFromInfo(info: StreamableTrackInfo, options: StreamOptions = DEFAULT_OPTIONS) {

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
