import { getInfo, StreamableTrackInfo } from "./info";
import {
    MimeType,
    Preset,
    Protocol,
    Quality,
    Transcoding
} from "./utils/transcoding";

const DEFAULT_OPTIONS: StreamOptions = {
    strict: false,
    preset: Preset.MP3,
    protocol: Protocol.PROGRESSIVE,
    mimeType: MimeType.MPEG,
    quality: Quality.SQ
};

const OPTION_WEIGHT = {
    mimeType: 1,
    preset: 1.1,
    protocol: 1.2,
    quality: 1.3
};

/**
 * Find a transcoding that matches the given options
 */
function findTranscoding(transcodings: Array<Transcoding>, options: StreamOptions): Transcoding | null {
    if (!transcodings.length) {
        return null;
    }
    else if (options.strict) {
        return transcodings.find(transcoding =>
            (!options.preset || transcoding.preset === options.preset) &&
            (!options.protocol || transcoding.format.protocol === options.protocol) &&
            (!options.mimeType || transcoding.format.mime_type === options.mimeType) &&
            (!options.quality || transcoding.quality === options.quality)
        ) ?? null;
    }
    else {
        const { transcoding: best } = transcodings.reduce((currentBest: ScoredTranscoding, transcoding) => {
            const current: ScoredTranscoding = {
                transcoding,
                score: 0
            };
            if (transcoding.preset === options.preset) {
                current.score += OPTION_WEIGHT.preset;
            }
            if (transcoding.format.protocol === options.protocol) {
                current.score += OPTION_WEIGHT.protocol;
            }
            if (transcoding.format.mime_type === options.mimeType) {
                current.score += OPTION_WEIGHT.mimeType;
            }
            if (transcoding.quality === options.quality) {
                current.score += OPTION_WEIGHT.quality;
            }
            return current.score > currentBest.score ? current : currentBest;
        }, {
            transcoding: null,
            score: 0
        });
        return best ?? transcodings[0];
    }
}

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

type ScoredTranscoding = {
    transcoding: Transcoding | null,
    score: number
};
