const stream = require("stream"); // Streams
const fetch = require("node-fetch"); // GET requests

var client_id, oauth_token; // SoundCloud API access

/*
Stream a song from its URL

@param URL: string
@return stream.Readable
*/
module.exports = function scdl(URL) {
    const read = new stream.PassThrough();
    getStreamableStreamURL(URL)
        .then(fetchAPI)
        .then(response => response.json())
        .then(json => fetch(json.url))
        .then(sound => sound.body.pipe(read))
        .catch(error => read.emit("error", error));
    return read;
}

/*
Set the client_id to access the API without an oauth_token

@param ID: string
*/
module.exports.setClientID = function setClientID(ID) {
    client_id = ID;
}

/*
Set the oauth_token to access the API without a client_id

@param token: string
*/
module.exports.setOauthToken = function setOauthToken(token) {
    oauth_token = token;
}

/*
GET metadata from a URL

@param URL: string
@return Promise<object>
*/
module.exports.getInfo = function getInfo(URL) {
    return new Promise((resolve, reject) => {
        fetchAPI("https://api-v2.soundcloud.com/resolve?url=" + handleExcess(URL))
            .then((response) => response.json())
            .then(resolve);
    });
}

/*
Stream a song from its metadata

@param info: object
@return stream.Readable
*/
module.exports.downloadFromInfo = function downloadFromInfo(info) {
    const read = new stream.PassThrough();
    if (info.streamable) {
        var progressive = info.media.transcodings.find((t) => t.format.protocol == "progressive");
        if (progressive) {
            fetchAPI(progressive.url)
                .then(response => response.json())
                .then(json => fetch(json.url))
                .then(sound => sound.body.pipe(read))
                .catch(error => read.emit("error", error));
        }
    }
    return read;
}

/*
Checks if a URL format matches a SoundCloud song

@param URL: string
@return Boolean
*/
module.exports.validateURL = function validateURL(URL) {
    URL = handleExcess(URL);
    var foo = URL.split('/');
    return (foo.length == 5 && URL.startsWith("https://soundcloud.com/")) || (foo.length == 3 && URL.startsWith("soundcloud.com/"));
}

/*
Formats a URL as the song's permalink URL

@param URL: string
@return string
*/
module.exports.getPermalinkURL = function getPermalinkURL(URL) {
    if (module.exports.validateURL(URL)) {
        URL = handleExcess(URL);
        var foo = URL.split('/');
        return "https://soundcloud.com/" + foo[foo.length - 2] + "/" + foo[foo.length - 1];
    }
}

/*
Remove fluff from URLs

@param URL: string
@return string
*/
function handleExcess(URL) {
    const cutoff = ['?', '#'];
    var foo = cutoff.reduce((str, chr) => str.includes(chr) ? str.substring(0, str.indexOf(chr)) : str, URL).trim().toLowerCase();
    return foo[foo.length - 1] == '/' ? foo.substring(0, foo.length - 1) : foo;
}

/*
Attempt to fetch with either client_id or oauth_token

@param URL: string
@return Promise<object>
*/
function fetchAPI(URL) {
    return new Promise((resolve, reject) => {
        var foo = URL.includes('?') ? '&' : '?';
        if (URL.includes('#')) {
            URL = URL.substring(0, URL.indexOf('#'));
        }
        if (client_id) {
            fetch(URL + foo + "client_id=" + client_id).then(resolve).catch(reject);
        }
        else if (oauth_token) {
            fetch(URL + foo + "oauth_token=" +  oauth_token).then(resolve).catch(reject);
        }
        else {
            reject("Authentication not set");
        }
    });
}

/*
Get a streamable song's streaming URL

@param URL: string
@return Promise<string>
*/
function getStreamableStreamURL(URL) {
    return new Promise((resolve, reject) => {
        module.exports.getInfo(URL).then((json) => {
            if (json.streamable) {
                var streamable = json.media.transcodings.find((t) => t.format.protocol == "progressive"); // Specifically grab the mp3 with the progressive protocol
                if (streamable) {
                    resolve(streamable.url);
                }
                else {
                    reject("Streamable stream URL not found for `" + URL + "`"); // Stream URL could not be found
                }
            }
            else {
                reject("`" + URL + "` not streamable"); // Song isn't streamable
            }
        }).catch(reject);
    });
}
