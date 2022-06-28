const { PassThrough } = require("stream"); // Streams
const phin = require("phin"); // GET requests
const HLS = require("parse-hls").default; // Parse HLS manifests

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
Wrapper for phin that properly throws error codes

@param options: Object
@return Promise<phinResponse>
*/
async function request(options) {
    const res = await phin(options);
    if (res.statusCode >= 400) {
        throw new Error(`${res.statusCode} ${res.statusMessage}`);
    }
    else {
        return res;
    }
}

/*
Synchronously stream from async functions

@param promise: Promise<stream.Readable>
@return stream.Readable
*/
function syncWrap(promise) {
    const readable = new PassThrough();
    promise
        .then(stream => stream.pipe(readable))
        .catch(error => readable.emit("error", error));
    return readable;
}

/*
Stream a song from its URL

@param url: String
@param options: Object
@return stream.Readable
*/
function scdl(url, options = defaultOptions) {
    return syncWrap(asyncScdl(url, options));
}

/*
Set the client_id to access the API without an oauth_token

@param ID: String
*/
function setClientID(ID) {
    config.client_id = ID;
}

/*
Set the oauth_token to access the API without a client_id

@param token: String
*/
function setOauthToken(token) {
    config.oauth_token = token;
}

/*
Promisified song streaming from URL

@param url: String
@param options: Object
@return Promise<stream.Readable>
*/
async function asyncScdl(url, options) {
    return asyncFromInfo(await getInfo(url), options);
}

/*
GET metadata from a URL

@param url: String
@return Promise<Object>
*/
async function getInfo(url) {
    const res = await fetchAPI(`https://api-v2.soundcloud.com/resolve?url=${handleExcess(url)}`);
    return res.body;
}

/*
Stream a song from its metadata

@param info: Object
@param options: Object
@return stream.Readable
*/
function downloadFromInfo(info, options = defaultOptions) {
    return syncWrap(asyncFromInfo(info, options));
}

/*
Promisified song streaming from metadata

@param info: Object
@param options: Object
@return Promise<stream.Readable>
*/
async function asyncFromInfo(info, options = defaultOptions) {
    if (info.streamable) {
        let transcoding = findTranscoding(info.media.transcodings, options);
        if (transcoding) {
            return streamTranscoding(transcoding);
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
Checks if a URL format matches a SoundCloud song

@param url: String
@return Boolean
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

@param url: String
@return string
*/
function getPermalinkURL(url) {
    if (validateURL(url)) {
        const parsedUrl = new URL(handleExcess(url));
        return `https://soundcloud.com${parsedUrl.pathname}`;
    }
}

/*
Remove fluff from URLs

@param url: String
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

@param url: String
@return Promise<Object>
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
    return request({
        url: parsedUrl.toString(),
        parse: "json"
    });
}

/*
Find a transcoding matching the provided options

@param transcodings: Array
@param options: Object
@return Object/void
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

@param transcoding: Object
@return Promise<stream.Readable>
*/
async function streamTranscoding(transcoding) {
    let hls = transcoding.format.protocol.trim().toLowerCase() === "hls";
    const url = (await fetchAPI(transcoding.url)).body.url;
    const res = await request({
        url,
        stream: !hls
    });
    return hls ? streamHls(res.body.toString("utf8")) : res.stream;
}

/*
Handle segmented audio stream of HLS format

@param hls: String
@return stream.Readable
*/
function streamHls(hls) {
    const read = new PassThrough();
    writeHlsChunks(read, hls)
        .catch(error => read.emit("error", error));
    return read;
}

/*
Get and write data for HLS format stream

@param stream: stream.Writable
@param hls: String
@return Promise<void>
*/
async function writeHlsChunks(stream, hls) {
    const segments = HLS.parse(hls).segments;
    for (let segment of segments) {
        let res = await request({ url: segment.uri });
        await streamWrite(stream, res.body);
    }
}

/*
Promisifies stream.Writable.write

@param stream: stream.Writable
@param chunk: any
@return Promise<void>
*/
function streamWrite(stream, chunk) {
    return new Promise(resolve => {
        if (stream.write(chunk)) {
            resolve();
        }
        else {
            stream.once("drain", resolve);
        }
    });
}

/*
Stream multiple songs from a playlist URL

@param url: String
@param options: Object
@return Promise<Array<stream.Readable>>
*/
async function downloadPlaylist(url, options = defaultOptions) {
    return playlistFromInfo(await getPlaylistInfo(url), options);
}

/*
Stream multiple songs from a playlist's metadata

@param info: Object
@param options: Object
@return Promise<Array<stream.Readable/null>>
*/
async function playlistFromInfo(info, options = defaultOptions) {
    if (info.tracks) {
        return Promise.allSettled(info.tracks.map(trackInfo => asyncFromInfo(trackInfo, options)))
            .then(results => results.map(result => result.status === "fulfilled" ? result.value : null));
    }
    else {
        return [];
    }
}

/*
Checks if a URL format matches a SoundCloud playlist

@param URL: String
@return Boolean
*/
function validatePlaylist(url) {
    try {
        const parsedUrl = new URL(handleExcess(url));
        const parsedPath = parsedUrl.pathname.split("/");
        return (parsedUrl.host.toLowerCase() === "soundcloud.com" || parsedUrl.host.toLowerCase() === "www.soundcloud.com") && parsedPath.length === 4 && parsedPath[2].toLowerCase() === "sets";
    }
    catch {
        return false;
    }
}

/*
Formats a URL as the playlist's permalink URL

@param URL: String
@return string
*/
function getPlaylistPermalink(url) {
    if (validatePlaylist(url)) {
        const parsedUrl = new URL(handleExcess(url));
        return `https://soundcloud.com${parsedUrl.pathname}`;
    }
}

/*
GET metadata from a URL, then GET missing metadata

@param url: String
@return Promise<Object>
*/
async function getPlaylistInfo(url) {
    const info = await getInfo(url);
    if (info.tracks) {
        return Promise.all(info.tracks.map(track => track.uri ? track : getInfo(`https://api.soundcloud.com/tracks/${track.id}`)))
            .then(tracks => ({
                ...info,
                tracks
            }));
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
        value: getInfo,
        enumerable: true
    },
    downloadFromInfo: {
        value: downloadFromInfo,
        enumerable: true
    },
    awaitDownloadFromInfo: {
        value: asyncFromInfo,
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
