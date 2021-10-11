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
function request(options) {
    return phin(options)
        .then(res => {
            if (res.statusCode >= 400) {
                throw new Error(`${res.statusCode} ${res.statusMessage}`);
            }
            else {
                return res;
            }
        });
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
function asyncScdl(url, options) {
    return getInfo(url)
        .then(info => asyncFromInfo(info, options));
}

/*
GET metadata from a URL

@param url: String
@return Promise<Object>
*/
function getInfo(url) {
    return fetchAPI(`https://api-v2.soundcloud.com/resolve?url=${handleExcess(url)}`)
        .then(res => res.body);
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
    let foo = new URL(handleExcess(url));
    return (foo.host.toLowerCase() === "soundcloud.com" || foo.host.toLowerCase() === "www.soundcloud.com") && foo.pathname.split("/").length === 3;
}

/*
Formats a URL as the song's permalink URL

@param url: String
@return string
*/
function getPermalinkURL(url) {
    if (validateURL(url)) {
        let foo = new URL(handleExcess(url));
        return `https://soundcloud.com${foo.pathname}`;
    }
}

/*
Remove fluff from URLs

@param url: String
@return string
*/
function handleExcess(url) {
    let foo = new URL(url);
    let bar = foo.pathname.split("/")
        .filter(str => Boolean(str))
        .join("/");
    return `${foo.origin}/${bar}${foo.search}`;
}

/*
Attempt to fetch with either client_id or oauth_token

@param url: String
@return Promise<Object>
*/
async function fetchAPI(url) {
    let foo = new URL(handleExcess(url));
    let bar = new URLSearchParams(foo.search);
    if (config.client_id) {
        bar.set("client_id", config.client_id);
    }
    else if (config.oauth_token) {
        bar.set("oauth_token", config.oauth_token);
    }
    else {
        throw new Error("Authentication not set");
    }
    foo.hash = "";
    foo.search = bar.toString();
    return request({
        url: foo.toString(),
        parse: "json"
    });
}

/*
Find a transcoding matching the provided options

@param transcodings: Array
@param options: Object
@return Object/undefined
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
function streamTranscoding(transcoding) {
    let hls = transcoding.format.protocol.trim().toLowerCase() === "hls";
    return fetchAPI(transcoding.url)
        .then(res => res.body.url)
        .then(url => request({
            url: url,
            stream: !hls
        }))
        .then(res => {
            if (hls) {
                return streamHls(res.body.toString("utf8"));
            }
            else {
                return res.stream;
            }
        });
}

/*
Handle segmented audio stream of HLS format

@param hls: String
@return Promise<stream.Readable>
*/
function streamHls(hls) {
    return Promise.all(HLS.parse(hls)
        .segments
        .map(segment => request({ url: segment.uri })
            .then(res => res.body))
    )
        .then(chunks => {
            const read = new PassThrough();
            chunks.forEach(chunk => read.write(chunk));
            return read;
        });
}

/*
Stream multiple songs from a playlist URL

@param url: String
@param options: Object
@return Promise<Array<stream.Readable>>
*/
function downloadPlaylist(url, options = defaultOptions) {
    return getPlaylistInfo(url)
        .then(info => playlistFromInfo(info, options));
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
    let foo = new URL(handleExcess(url));
    let bar = foo.pathname.split("/");
    return (foo.host.toLowerCase() === "soundcloud.com" || foo.host.toLowerCase() === "www.soundcloud.com") && bar.length === 4 && bar[2].toLowerCase() === "sets";
}

/*
Formats a URL as the playlist's permalink URL

@param URL: String
@return string
*/
function getPlaylistPermalink(url) {
    if (validatePlaylist(url)) {
        let foo = new URL(handleExcess(url));
        return `https://soundcloud.com${foo.pathname}`;
    }
}

/*
GET metadata from a URL, then GET missing metadata

@param url: String
@return Promise<Object>
*/
function getPlaylistInfo(url) {
    return getInfo(url)
        .then(info => {
            if (info.tracks) {
                return Promise.all(info.tracks.map(track => track.uri ? track : getInfo(`https://api.soundcloud.com/tracks/${track.id}`)))
                    .then(tracks => ({
                        ...info,
                        tracks
                    }));
            }
        });
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
