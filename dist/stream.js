"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.streamPlaylistFromInfoSync = exports.streamPlaylist = exports.streamPlaylistFromInfo = exports.streamFromInfoSync = exports.streamSync = exports.stream = exports.streamFromInfo = void 0;
const parse_hls_1 = __importDefault(require("parse-hls"));
const stream_1 = require("stream");
const dispatch_1 = require("./dispatch");
const info_1 = require("./info");
const error_1 = require("./utils/error");
const partial_1 = require("./utils/partial");
const transcoding_1 = require("./utils/transcoding");
const DEFAULT_OPTIONS = {
    strict: false,
    preset: transcoding_1.Preset.MP3,
    protocol: transcoding_1.Protocol.PROGRESSIVE,
    mimeType: transcoding_1.MimeType.MPEG,
    quality: transcoding_1.Quality.SQ
};
const OPTION_WEIGHT = {
    mimeType: 1,
    preset: 1.1,
    protocol: 1.2,
    quality: 1.3
};
function streamHls(url, output) {
    return __awaiter(this, void 0, void 0, function* () {
        const hlsRes = yield (0, dispatch_1.request)(url);
        const { segments } = parse_hls_1.default.parse(yield hlsRes.body.text());
        for (const segment of segments) {
            yield (0, dispatch_1.streamThrough)(new URL(segment.uri), output, false);
        }
        return output.end();
    });
}
/**
 * Create a stream from a transcoding object
 * @param transcoding The transcoding to stream
 * @param output Existing output stream from `streamSync`
 * @returns The output stream, previously existing or not
 */
function streamTranscoding(transcoding, output) {
    return __awaiter(this, void 0, void 0, function* () {
        const { url: streamUrl } = yield (0, dispatch_1.requestWithAuth)(transcoding.url);
        const url = new URL(streamUrl);
        const outStream = output !== null && output !== void 0 ? output : new stream_1.PassThrough();
        outStream.transcoding = transcoding;
        outStream.emit("transcoding", transcoding);
        const streaming = transcoding.format.protocol === transcoding_1.Protocol.HLS ?
            streamHls(url, outStream) :
            (0, dispatch_1.streamThrough)(url, outStream);
        if (output) {
            streaming.catch(err => outStream.emit("error", err));
        }
        else {
            yield streaming;
        }
        return outStream;
    });
}
/**
 * Find a transcoding that matches the given options
 * @param transcodings Transcodings obtained from a track's info
 * @param options Transcoding search options
 */
function findTranscoding(transcodings, options) {
    var _a;
    if (!transcodings.length) {
        return null;
    }
    else if (options.strict) {
        return (_a = transcodings.find(transcoding => (!options.preset || transcoding.preset === options.preset) &&
            (!options.protocol || transcoding.format.protocol === options.protocol) &&
            (!options.mimeType || transcoding.format.mime_type === options.mimeType) &&
            (!options.quality || transcoding.quality === options.quality))) !== null && _a !== void 0 ? _a : null;
    }
    else {
        const { transcoding: best } = transcodings.reduce((currentBest, transcoding) => {
            const current = {
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
        return best !== null && best !== void 0 ? best : transcodings[0];
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
function streamEngine(info, options, output) {
    return __awaiter(this, void 0, void 0, function* () {
        if (info.streamable === false) {
            throw new error_1.ScdlError("Track not streamable");
        }
        const transcoding = findTranscoding(info.media.transcodings, options);
        if (transcoding) {
            return streamTranscoding(transcoding, output);
        }
        else {
            throw new error_1.ScdlError("Failed to obtain transcoding");
        }
    });
}
/**
 * * Stream a track from its info object
 *
 * Used internally by `stream`
 * @param info Info obtained from `getInfo`
 * @param options Transcoding search options
 */
function streamFromInfo(info, options = DEFAULT_OPTIONS) {
    return __awaiter(this, void 0, void 0, function* () {
        return streamEngine(info.data, options);
    });
}
exports.streamFromInfo = streamFromInfo;
/**
 * Stream a track from its URL
 * @param url A track URL
 * @param options Transcoding search options
 */
function stream(url, options = DEFAULT_OPTIONS) {
    return __awaiter(this, void 0, void 0, function* () {
        const info = yield (0, info_1.getInfo)(url);
        return streamFromInfo(info, options);
    });
}
exports.stream = stream;
/**
 * Synchronously stream a track from its URL
 * @param url A track URL
 * @param options Transcoding search options
 */
function streamSync(url, options = DEFAULT_OPTIONS) {
    const output = new stream_1.PassThrough();
    (0, info_1.getInfo)(url)
        .then(info => streamEngine(info.data, options, output))
        .catch(err => output.emit("error", err));
    return output;
}
exports.streamSync = streamSync;
/**
 * Synchronously stream a track from its info object
 * @param info Info obtained from `getInfo`
 * @param options Transcoding search options
 */
function streamFromInfoSync(info, options = DEFAULT_OPTIONS) {
    const output = new stream_1.PassThrough();
    streamEngine(info.data, options, output)
        .catch(err => output.emit("error", err));
    return output;
}
exports.streamFromInfoSync = streamFromInfoSync;
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
function streamPlaylistFromInfo(info, options = DEFAULT_OPTIONS) {
    return __awaiter(this, void 0, void 0, function* () {
        yield (0, partial_1.fetchPartialPlaylist)(info);
        return Promise.all(info.data.tracks.map((track) => __awaiter(this, void 0, void 0, function* () {
            try {
                return yield streamEngine(track, options);
            }
            catch (_a) {
                return null;
            }
        })));
    });
}
exports.streamPlaylistFromInfo = streamPlaylistFromInfo;
/**
 * Stream tracks from a playlist's URL
 * @param url A playlist URL
 * @param options Transcoding search options
 * @returns A promise that resolves in an array. Each item will be either a readable stream or `null` if streaming errored
 */
function streamPlaylist(url, options = DEFAULT_OPTIONS) {
    return __awaiter(this, void 0, void 0, function* () {
        const info = yield (0, info_1.getPlaylistInfo)(url);
        return streamPlaylistFromInfo(info, options);
    });
}
exports.streamPlaylist = streamPlaylist;
/**
 * Synchronously stream tracks from a playlist's info object
 * @param info Info obtained from `getPlaylistInfo`
 * @param options Transcoding search options
 */
function streamPlaylistFromInfoSync(info, options = DEFAULT_OPTIONS) {
    return info.data.tracks.map(track => {
        const output = new stream_1.PassThrough();
        streamEngine(track, options, output)
            .catch(err => output.emit("error", err));
        return output;
    });
}
exports.streamPlaylistFromInfoSync = streamPlaylistFromInfoSync;
