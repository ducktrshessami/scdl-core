const { PassThrough } = require("stream"); // Streams
const phin = require("phin"); // GET requests
const HLS = require("parse-hls").default; // Parse HLS manifests

var client_id, oauth_token; // SoundCloud API access

const defaultOptions = { // Default stream properties
    strict: false,
    preset: "mp3_0_1",
    protocol: "progressive",
    mimeType: "audio/mpeg",
    quality: "sq"
};

module.exports = scdl;
module.exports.setClientID = setClientID;
module.exports.setOauthToken = setOauthToken;
module.exports.getInfo = getInfo;
module.exports.downloadFromInfo = downloadFromInfo;
module.exports.validateURL = validateURL;
module.exports.getPermalinkURL = getPermalinkURL;
module.exports.playlist = downloadPlaylist;
module.exports.playlist.downloadFromInfo = playlistFromInfo;
module.exports.playlist.validateURL = validatePlaylist;
module.exports.playlist.getPermalinkURL = getPlaylistPermalink;

/*
Stream a song from its URL

@param url: string
@return stream.Readable
*/
function scdl(url, options = defaultOptions) {
    const read = new PassThrough();
    getInfo(url)
        .then(info => downloadFromInfo(info, options))
        .then(infoStream => infoStream.pipe(read))
        .catch(error => read.emit("error", error));
    return read;
}

/*
Set the client_id to access the API without an oauth_token

@param ID: string
*/
function setClientID(ID) {
    client_id = ID;
}

/*
Set the oauth_token to access the API without a client_id

@param token: string
*/
function setOauthToken(token) {
    oauth_token = token;
}

/*
GET metadata from a URL

@param url: string
@return Promise<object>
*/
function getInfo(url) {
    return new Promise((resolve, reject) => {
        fetchAPI(`https://api-v2.soundcloud.com/resolve?url=${handleExcess(url)}`)
            .then(res => res.body)
            .then(resolve)
            .catch(reject);
    });
}

/*
Stream a song from its metadata

@param info: object
@return stream.Readable
*/
function downloadFromInfo(info, options = defaultOptions) {
    const read = new PassThrough();
    if (info.streamable) {
        var transcoding = findTranscoding(info.media.transcodings, options);
        if (transcoding) {
            streamTranscoding(transcoding)
                .then(stream => stream
                    .on("error", err => read.emit("error", err))
                    .pipe(read)
                )
                .catch(error => read.emit("error", error));
        }
        else {
            throw new Error("Failed to obtain transcoding");
        }
    }
    else {
        throw new Error("Song not streamable");
    }
    return read;
}

/*
Checks if a URL format matches a SoundCloud song

@param url: string
@return Boolean
*/
function validateURL(url) {
    let foo = new URL(handleExcess(url));
    return (foo.host.toLowerCase() === "soundcloud.com" || foo.host.toLowerCase() === "www.soundcloud.com") && foo.pathname.split("/").length === 3;
}

/*
Formats a URL as the song's permalink URL

@param url: string
@return string
*/
function getPermalinkURL(url) {
    if (validateURL(url)) {
        var foo = new URL(handleExcess(url));
        return `https://soundcloud.com${foo.pathname}`;
    }
}

/*
Remove fluff from URLs

@param url: string
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

@param url: string
@return Promise<object>
*/
function fetchAPI(url) {
    return new Promise((resolve, reject) => {
        var foo = new URL(handleExcess(url));
        var bar = new URLSearchParams(foo.search);
        if (client_id) {
            bar.set("client_id", client_id);
        }
        else if (oauth_token) {
            bar.set("oauth_token", oauth_token);
        }
        else {
            reject(new Error("Authentication not set"));
            return;
        }
        foo.hash = "";
        foo.search = bar.toString();
        phin({
            url: foo.toString(),
            parse: "json"
        })
            .then(resolve)
            .catch(reject);
    });
}

/*
Find a transcoding matching the provided options

@param transcodings: Array
@param options: object
@return object/undefined
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
        .then(url => phin({
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
        .map(segment => phin({ url: segment.uri })
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

@param url: string
@return Promise<Array<stream.Readable>>
*/
function downloadPlaylist(url, options = defaultOptions) {
    return getInfo(url)
        .then(info => playlistFromInfo(info, options));
}

/*
Stream multiple songs from a playlist's metadata

@param info: object
@return Promise<Array<stream.Readable>>
*/
async function playlistFromInfo(info, options = defaultOptions) {
    let foo = [];
    if (info.tracks) {
        foo = Promise.all(info.tracks.map(trackInfo => {
            if (trackInfo.streamable) {
                return downloadFromInfo(trackInfo, options);
            }
            else {
                return getInfo(`https://api.soundcloud.com/tracks/${trackInfo.id}`)
                    .then(extendedInfo => downloadFromInfo(extendedInfo, options));
            }
        }));
    }
    return foo;
}

/*
Checks if a URL format matches a SoundCloud playlist

@param URL: string
@return Boolean
*/
function validatePlaylist(url) {
    let foo = new URL(handleExcess(url));
    let bar = foo.pathname.split("/");
    return (foo.host.toLowerCase() === "soundcloud.com" || foo.host.toLowerCase() === "www.soundcloud.com") && bar.length === 4 && bar[2].toLowerCase() === "sets";
}

/*
Formats a URL as the playlist's permalink URL

@param URL: string
@return string
*/
function getPlaylistPermalink(url) {
    if (validatePlaylist(url)) {
        var foo = new URL(handleExcess(url));
        return `https://soundcloud.com${foo.pathname}`;
    }
}
