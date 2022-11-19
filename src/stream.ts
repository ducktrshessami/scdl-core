import HLS from "parse-hls";
import { PassThrough, Readable } from "stream";
import {
    request,
    requestWithAuth,
    streamThrough
} from "./dispatch";
import { getInfo, StreamableTrackInfo } from "./info";
import { ScdlError } from "./utils/error";
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

async function streamHls(url: URL, output: PassThrough): Promise<Readable> {
    const hlsRes = await request(url);
    const { segments } = HLS.parse(await hlsRes.body.text());
    for (const segment of segments) {
        await streamThrough(new URL(segment.uri), output, false);
    }
    return output.end();
}

/**
 * Create a stream from a transcoding object
 * @param transcoding The transcoding to stream
 * @param output Existing output stream from {@link streamSync}
 * @returns The output stream, previously existing or not
 */
async function streamTranscoding(transcoding: Transcoding, output?: PassThrough): Promise<TrackStream> {
    const { url: streamUrl }: TranscodingStreamResponse = await requestWithAuth(transcoding.url);
    const url = new URL(streamUrl);
    const outStream: TrackStream = output ?? new PassThrough();
    outStream.transcoding = transcoding;
    outStream.emit("transcoding", transcoding);
    const streaming = transcoding.format.protocol === Protocol.HLS ?
        streamHls(url, outStream as PassThrough) :
        streamThrough(url, outStream as PassThrough);
    if (output) {
        streaming.catch(err => outStream.emit("error", err));
    }
    else {
        await streaming;
    }
    return outStream;
}

/**
 * Find a transcoding that matches the given options
 * @param transcodings Transcodings obtained from a track's info
 * @param options Transcoding search options
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
 * Underlying transcoding resolution and stream dispatch
 * 
 * Not exportable
 * @param info Info obtained from {@link getInfo}
 * @param options Transcoding search options
 * @param output Existing output stream from {@link streamSync}
 */
async function streamEngine(
    info: StreamableTrackInfo,
    options: StreamOptions,
    output?: PassThrough
): Promise<TrackStream> {
    if (info.streamable === false) {
        throw new ScdlError("Track not streamable");
    }
    const transcoding = findTranscoding(info.media.transcodings, options);
    if (transcoding) {
        return streamTranscoding(transcoding, output);
    }
    else {
        throw new ScdlError("Failed to obtain transcoding");
    }
}

/**
 * * Stream a track from its info object
 * 
 * Used internally by `stream`
 * @param info Info obtained from {@link getInfo}
 * @param options Transcoding search options
 */
export async function streamFromInfo(info: StreamableTrackInfo, options: StreamOptions = DEFAULT_OPTIONS): Promise<TrackStream> {
    return streamEngine(info, options);
}

/**
 * Stream a track from its URL
 * @param url A track URL
 * @param options Transcoding search options
 */
export async function stream(url: string, options: StreamOptions = DEFAULT_OPTIONS): Promise<TrackStream> {
    const info = await getInfo(url);
    return streamFromInfo(info, options);
}

/**
 * Synchronously stream a track from its URL
 * @param url A track URL
 * @param options Transcoding search options
 */
export function streamSync(url: string, options: StreamOptions = DEFAULT_OPTIONS): TrackStream {
    const output = new PassThrough();
    getInfo(url)
        .then(info => streamEngine(info, options, output))
        .catch(err => output.emit("error", err));
    return output;
}

/**
 * Synchronously stream a track from its info object
 * @param info Info obtained from {@link getInfo}
 * @param options Transcoding search options
 */
export function streamFromInfoSync(info: StreamableTrackInfo, options: StreamOptions = DEFAULT_OPTIONS): TrackStream {
    const output = new PassThrough();
    streamEngine(info, options, output)
        .catch(err => output.emit("error", err));
    return output;
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

type TranscodingStreamResponse = {
    url: string
};

interface StreamingTranscoding {
    transcoding?: Transcoding;
    on(event: "transcoding", listener: (transcoding: Transcoding) => void): this;
    on(event: "connect", listener: () => void): this;
}

export type TrackStream = Readable & StreamingTranscoding;
