const { PassThrough } = require("stream"); // Streams
const { Agent } = require("undici"); // GET requests
const { default: HLS } = require("parse-hls"); // Parse HLS manifests
const { STATUS_CODES } = require("http"); // HTTP error messages

const agent = new Agent(); // Potentially variable origin dispatching

const config = { // SoundCloud API access
    client_id: null,
    oauth_token: null
};

const defaultOptions = { // Default stream properties
    strict: false,
    preset: "mp3_0_1",
    protocol: "progressive",
    mimeType: "audio/mpeg",
    quality: "sq"
};

/*
Create request options from a url

@param url: URL
@return Object
*/
function requestOptions(url) {
    return {
        origin: url.origin,
        path: url.pathname + url.search,
        method: "GET"
    };
}

/*
Wrapper for undici that throws error codes

@param url: URL
@return Promise<undici.Dispatcher.ResponseData>
*/
async function request(url) {
    const res = await agent.request(requestOptions(url));
    if (res.statusCode >= 400) {
        throw new Error(`${res.statusCode} ${STATUS_CODES[res.statusCode]}`);
    }
    else {
        return res;
    }
}

/*
Mimics undici.stream but properly ends the PassThrough

@param url: string
@param output: stream.PassThrough
@param end: boolean
@return Promise<stream.PassThrough>
*/
function streamThrough(url, output, end = true) {
    return new Promise((resolve, reject) => agent.dispatch(requestOptions(url), {
        onConnect: () => output.emit("connect"),
        onHeaders: statusCode => {
            if (statusCode >= 400) {
                reject(new Error(`${res.statusCode} ${STATUS_CODES[res.statusCode]}`));
            }
        },
        onData: chunk => {
            output.write(chunk)
        },
        onComplete: () => {
            if (end) {
                output.end();
            }
            resolve(output)
        },
        onError: reject
    }));
}

/*
Stream a song from its URL

@param url: string
@param options: Object
@return stream.Readable
*/
function scdl(url, options = defaultOptions) {
    const output = new PassThrough();
    getInfo(url)
        .then(info => asyncFromInfo(info, output, options))
        .catch(error => output.emit("error", error));
    return output;
}

/*
Set the client_id to access the API without an oauth_token

@param ID: string
*/
function setClientID(ID) {
    config.client_id = ID;
}

/*
Set the oauth_token to access the API without a client_id

@param token: string
*/
function setOauthToken(token) {
    config.oauth_token = token;
}

/*
Promisified song streaming from URL

@param url: string
@param options: object
@return Promise<stream.Readable>
*/
async function asyncScdl(url, options) {
    return asyncFromInfo(await getInfo(url), null, options);
}

/*
GET metadata from a URL

@param url: string
@return Promise<object>
*/
function getInfo(url) {
    return fetchAPI(`https://api-v2.soundcloud.com/resolve?url=${handleExcess(url)}`);
}

/*
getInfo but track specific and exportable

@param url: string
@return Promise<object>
*/
async function getTrackInfo(url) {
    if (validateURL(url)) {
        return getInfo(url);
    }
    else {
        throw new Error("Invalid track URL");
    }
}

/*
Stream a song from its metadata

@param info: object
@param options: object
@return stream.Readable
*/
function downloadFromInfo(info, options = defaultOptions) {
    const output = new PassThrough();
    asyncFromInfo(info, output, options)
        .catch(error => output.emit("error", error));
    return output;
}

/*
Promisified song streaming from metadata

@param info: object
@param output: stream.Writable | null
@param options: object
@return Promise<stream.Readable>
*/
async function asyncFromInfo(info, output, options = defaultOptions) {
    if (info.streamable) {
        const transcoding = findTranscoding(info.media.transcodings, options);
        if (transcoding) {
            return streamTranscoding(transcoding, output);
        }
        else {
            throw new Error("Failed to obtain transcoding");
        }
    }
    else {
        throw new Error("Song not streamable");
    }
}

/*
asyncFromInfo, but exportable

@param info: object
@param options: object
@return Promise<stream.Readable>
*/
function awaitDownloadFromInfo(info, options) {
    return asyncFromInfo(info, null, options);
}

/*
Checks if a URL format matches the SoundCloud song url format

@param url: string
@return boolean
*/
function validateURL(url) {
    try {
        const parsedUrl = new URL(handleExcess(url));
        return (parsedUrl.host.toLowerCase() === "soundcloud.com" || parsedUrl.host.toLowerCase() === "www.soundcloud.com") && parsedUrl.pathname.split("/").length === 3;
    }
    catch {
        return false;
    }
}

/*
Formats a URL as the song's permalink URL

@param url: string
@return string
*/
function getPermalinkURL(url) {
    if (validateURL(url)) {
        const parsedUrl = new URL(handleExcess(url));
        return `https://soundcloud.com${parsedUrl.pathname}`;
    }
    else {
        return "";
    }
}

/*
Remove fluff from URLs

@param url: string
@return string
*/
function handleExcess(url) {
    const parsedUrl = new URL(url);
    const parsedPath = parsedUrl.pathname.split("/")
        .filter(str => Boolean(str))
        .join("/");
    return `${parsedUrl.origin}/${parsedPath}${parsedUrl.search}`;
}

/*
Attempt to fetch with either client_id or oauth_token

@param url: string
@return Promise<object>
*/
async function fetchAPI(url) {
    const parsedUrl = new URL(handleExcess(url));
    const parsedSearch = new URLSearchParams(parsedUrl.search);
    if (config.client_id) {
        parsedSearch.set("client_id", config.client_id);
    }
    else if (config.oauth_token) {
        parsedSearch.set("oauth_token", config.oauth_token);
    }
    else {
        throw new Error("Authentication not set");
    }
    parsedUrl.hash = "";
    parsedUrl.search = parsedSearch.toString();
    const { body } = await request(parsedUrl);
    return body.json();
}

/*
Find a transcoding matching the provided options

@param transcodings: Array
@param options: object
@return object/void
*/
function findTranscoding(transcodings, options) {
    if (options.strict) { // Match all present options
        return transcodings.find(tc => (
            options.preset ? tc.preset.toLowerCase().trim().includes(options.preset.toLowerCase().trim()) : true
                && options.protocol ? tc.format.protocol.toLowerCase().trim().includes(options.protocol.toLowerCase().trim()) : true
                    && options.mimeType ? tc.format.mime_type.toLowerCase().trim().includes(options.mimeType.toLowerCase().trim()) : true
                        && options.quality ? tc.quality.toLowerCase().trim().includes(options.quality.toLowerCase().trim()) : true
        ));
    }
    else { // Find closest match
        let index = 0, best = 0;
        for (let i = 0; i < transcodings.length; i++) {
            let score = 0; // Match scoring
            if (options.preset && transcodings[i].preset.toLowerCase().trim().includes(options.preset.toLowerCase().trim())) {
                score += 1.1;
            }
            if (options.protocol && transcodings[i].format.protocol.toLowerCase().trim().includes(options.protocol.toLowerCase().trim())) {
                score += 1.2;
            }
            if (options.mimeType && transcodings[i].format.mime_type.toLowerCase().trim().includes(options.mimeType.toLowerCase().trim())) {
                score += 1;
            }
            if (options.quality && transcodings[i].quality.toLowerCase().trim().includes(options.quality.toLowerCase().trim())) {
                score += 1.3;
            }
            if (score > best) { // Best check
                index = i;
                best = score;
            }
        }
        if (best) { // Match found
            return transcodings[index];
        }
        else { // Not even close. Try default options once
            options = defaultOptions;
            options.strict = true;
            return findTranscoding(transcodings, options);
        }
    }
}

/*
Asynchonously create a readable stream from a transcoding object

@param transcoding: object
@param stream: stream.Writable | null
@return Promise<stream.Readable>
*/
async function streamTranscoding(transcoding, stream) {
    let streaming;
    const { url } = await fetchAPI(transcoding.url);
    const parsedURL = new URL(url);
    const output = stream || new PassThrough();
    output.transcoding = transcoding;
    output?.emit("transcoding", transcoding);
    if (transcoding.format.protocol.toLowerCase() === "hls") {
        const res = await request(parsedURL);
        streaming = writeHlsChunks(output, await res.body.text());
    }
    else {
        streaming = streamThrough(parsedURL, output);
    }
    if (stream) {
        streaming.catch(err => output.emit("error", err));
    }
    else {
        await streaming;
    }
    return output;
}

/*
Get and write data for HLS format stream

@param stream: stream.Writable
@param hls: string
@return Promise<void>
*/
async function writeHlsChunks(stream, hls) {
    const { segments } = HLS.parse(hls);
    for (let segment of segments) {
        await streamThrough(new URL(segment.uri), stream, false);
    }
    stream.end();
}

/*
Stream multiple songs from a playlist URL

@param url: string
@param options: object
@return Promise<Array<stream.Readable>>
*/
async function downloadPlaylist(url, options = defaultOptions) {
    return playlistFromInfo(await getPlaylistInfo(url), options);
}

/*
Stream multiple songs from a playlist's metadata

@param info: object
@param options: object
@return Promise<Array<stream.Readable/null>>
*/
async function playlistFromInfo(info, options = defaultOptions) {
    if (info.tracks) {
        return Promise.allSettled(info.tracks.map(trackInfo => asyncFromInfo(trackInfo, null, options)))
            .then(results => results.map(result => result.status === "fulfilled" ? result.value : null));
    }
    else {
        return [];
    }
}

/*
Checks if a URL format matches a SoundCloud playlist

@param url: string
@return boolean
*/
function validatePlaylist(url) {
    try {
        const parsedUrl = new URL(handleExcess(url));
        const parsedPath = parsedUrl.pathname.split("/");
        return (parsedUrl.host.toLowerCase() === "soundcloud.com" || parsedUrl.host.toLowerCase() === "www.soundcloud.com") &&
            (parsedPath.length === 4 || parsedPath.length === 5) &&
            parsedPath[2].toLowerCase() === "sets";
    }
    catch {
        return false;
    }
}

/*
Formats a URL as the playlist's permalink URL

@param url: string
@return string
*/
function getPlaylistPermalink(url) {
    if (validatePlaylist(url)) {
        const parsedUrl = new URL(handleExcess(url));
        return `https://soundcloud.com${parsedUrl.pathname}`;
    }
    else {
        return "";
    }
}

/*
GET metadata from a URL, then GET missing metadata

@param url: string
@return Promise<object>
*/
async function getPlaylistInfo(url) {
    if (validatePlaylist(url)) {
        const info = await getInfo(url);
        if (info.tracks) {
            return Promise.all(info.tracks.map(track => track.uri ? track : getInfo(`https://api.soundcloud.com/tracks/${track.id}`)))
                .then(tracks => ({
                    ...info,
                    tracks
                }));
        }
        else {
            return info;
        }
    }
    else {
        throw new Error("Invalid playlist URL");
    }
}

Object.defineProperties(downloadPlaylist, {
    downloadFromInfo: {
        value: playlistFromInfo,
        enumerable: true
    },
    validateURL: {
        value: validatePlaylist,
        enumerable: true
    },
    getPermalinkURL: {
        value: getPlaylistPermalink,
        enumerable: true
    },
    getInfo: {
        value: getPlaylistInfo,
        enumerable: true
    }
});

Object.defineProperties(scdl, {
    clientID: {
        get: () => config.client_id,
        set: setClientID
    },
    oauthToken: {
        get: () => config.oauth_token,
        set: setOauthToken
    },
    setClientID: {
        value: setClientID,
        enumerable: true
    },
    setOauthToken: {
        value: setOauthToken,
        enumerable: true
    },
    awaitDownload: {
        value: asyncScdl,
        enumerable: true
    },
    getInfo: {
        value: getTrackInfo,
        enumerable: true
    },
    downloadFromInfo: {
        value: downloadFromInfo,
        enumerable: true
    },
    awaitDownloadFromInfo: {
        value: awaitDownloadFromInfo,
        enumerable: true
    },
    validateURL: {
        value: validateURL,
        enumerable: true
    },
    getPermalinkURL: {
        value: getPermalinkURL,
        enumerable: true
    },
    playlist: {
        value: downloadPlaylist,
        enumerable: true
    }
});

Object.defineProperty(module, "exports", {
    value: scdl,
    enumerable: true
});
