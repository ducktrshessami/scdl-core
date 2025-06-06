import { M3uParser } from "m3u-parser-generator";
import { PassThrough, Readable } from "stream";
import {
    request,
    requestWithAuth,
    streamThrough
} from "./dispatch";
import {
    StreamableTrackInfo,
    StreamableTrackInfoData,
    getInfo,
    getPlaylistInfo
} from "./info";
import { ScdlError } from "./utils/error";
import { FetchablePlaylistInfo, fetchPartialPlaylist } from "./utils/partial";
import { StreamablePlaylistInfo } from "./utils/playlist";
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

const OPTION_WEIGHT: Record<keyof TranscodingOptions, number> = {
    mimeType: 1,
    preset: 1.1,
    protocol: 1.2,
    quality: 1.3
};

async function streamHls(url: URL, output: PassThrough): Promise<Readable> {
    const hlsRes = await request(url);
    const parser = new M3uParser();
    const { medias } = parser.parse(await hlsRes.body.text());
    for (const media of medias) {
        await streamThrough(new URL(media.location), output, false);
    }
    return output.end();
}

/**
 * Create a stream from a transcoding object
 * @param transcoding The transcoding to stream
 * @param output Existing output stream from `streamSync`
 * @returns The output stream, previously existing or not
 */
async function streamTranscoding(transcoding: Transcoding, output?: PassThrough): Promise<TrackStream> {
    const { url: streamUrl }: TranscodingStreamResponse = await requestWithAuth(transcoding.url);
    const url = new URL(streamUrl);
    const outStream: RawTrackStream = output ?? new PassThrough();
    outStream.transcoding = transcoding;
    outStream.emit("transcoding", transcoding);
    const streaming = transcoding.format.protocol === Protocol.HLS ?
        streamHls(url, outStream) :
        streamThrough(url, outStream);
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
            const data: TranscodingOptions = {
                preset: transcoding.preset,
                protocol: transcoding.format.protocol,
                mimeType: transcoding.format.mime_type,
                quality: transcoding.quality
            };
            const current: ScoredTranscoding = {
                transcoding,
                score: Object
                    .keys(OPTION_WEIGHT)
                    .reduce((score, key) => {
                        if (data[<keyof TranscodingOptions>key] === options[<keyof TranscodingOptions>key]) {
                            score += OPTION_WEIGHT[<keyof TranscodingOptions>key];
                        }
                        return score;
                    }, 0)
            };
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
 * @param info Info obtained from `getInfo`
 * @param options Transcoding search options
 * @param output Existing output stream from `streamSync`
 */
async function streamEngine(
    info: StreamableTrackInfoData,
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
 * @param info Info obtained from `getInfo`
 * @param options Transcoding search options
 */
export async function streamFromInfo(info: StreamableTrackInfo, options: StreamOptions = DEFAULT_OPTIONS): Promise<TrackStream> {
    return streamEngine(info.data, options);
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
        .then(info => streamEngine(info.data, options, output))
        .catch(err => output.emit("error", err));
    return output;
}

/**
 * Synchronously stream a track from its info object
 * @param info Info obtained from `getInfo`
 * @param options Transcoding search options
 */
export function streamFromInfoSync(info: StreamableTrackInfo, options: StreamOptions = DEFAULT_OPTIONS): TrackStream {
    const output = new PassThrough();
    streamEngine(info.data, options, output)
        .catch(err => output.emit("error", err));
    return output;
}

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
export async function streamPlaylistFromInfo(info: StreamablePlaylistInfo | FetchablePlaylistInfo, options: StreamOptions = DEFAULT_OPTIONS): Promise<Array<TrackStream | null>> {
    await fetchPartialPlaylist(info as FetchablePlaylistInfo);
    return Promise.all(
        info.data.tracks.map(async track => {
            try {
                return await streamEngine(track as StreamableTrackInfoData, options);
            }
            catch {
                return null;
            }
        })
    );
}

/**
 * Stream tracks from a playlist's URL
 * @param url A playlist URL
 * @param options Transcoding search options
 * @returns A promise that resolves in an array. Each item will be either a readable stream or `null` if streaming errored
 */
export async function streamPlaylist(url: string, options: StreamOptions = DEFAULT_OPTIONS): Promise<Array<TrackStream | null>> {
    const info = await getPlaylistInfo(url);
    return streamPlaylistFromInfo(info, options);
}

/**
 * Synchronously stream tracks from a playlist's info object
 * @param info Info obtained from `getPlaylistInfo`
 * @param options Transcoding search options
 */
export function streamPlaylistFromInfoSync(info: StreamablePlaylistInfo, options: StreamOptions = DEFAULT_OPTIONS): Array<TrackStream> {
    return info.data.tracks.map(track => {
        const output = new PassThrough();
        streamEngine(track, options, output)
            .catch(err => output.emit("error", err));
        return output;
    });
}

type TranscodingOptions = {
    preset: Preset,
    protocol: Protocol,
    mimeType: MimeType,
    quality: Quality
};

export type StreamOptions = Partial<TranscodingOptions> & {
    /**
     * If `true`, will only stream if all specified options match a transcoding
     * 
     * If `false`, will stream most similar transcoding
     * 
     * Defaults to `false`
     */
    strict?: boolean
};

type ScoredTranscoding = {
    transcoding: Transcoding | null,
    score: number
};

type TranscodingStreamResponse = {
    url: string
};

interface Emitter<EventMap extends Record<string, any[]>> {
    emit<Event extends keyof EventMap>(event: Event, ...args: EventMap[Event]): boolean;
    addListener<Event extends keyof EventMap>(event: Event, listener: (...args: EventMap[Event]) => any): this;
    on<Event extends keyof EventMap>(event: Event, listener: (...args: EventMap[Event]) => any): this;
    once<Event extends keyof EventMap>(event: Event, listener: (...args: EventMap[Event]) => any): this;
    prependListener<Event extends keyof EventMap>(event: Event, listener: (...args: EventMap[Event]) => any): this;
    prependOnceListener<Event extends keyof EventMap>(event: Event, listener: (...args: EventMap[Event]) => any): this;
    removeListener<Event extends keyof EventMap>(event: Event, listener: (...args: EventMap[Event]) => any): this;
    off(event: keyof EventMap, listener: (...args: any[]) => any): this;
}

type TranscodingStreamEvents = {
    transcoding: [Transcoding],
    connect: []
};

interface BaseTranscodingStream extends Emitter<TranscodingStreamEvents> {
    transcoding?: Transcoding;
}

export type RawTrackStream = BaseTranscodingStream & PassThrough;

export type TrackStream = BaseTranscodingStream & Readable;
