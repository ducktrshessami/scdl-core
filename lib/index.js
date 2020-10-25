const stream = require("stream"); // Streams
const fetch = require("node-fetch"); // GET requests

var client_id, oauth_token; // SoundCloud API access

module.exports = function scdl(URL) { // Stream a song from its URL
    const read = new stream.PassThrough();
    getStreamableStreamURL(URL)
        .then(fetchAPI)
        .then(response => response.json())
        .then(json => fetch(json.url))
        .then(sound => sound.body.pipe(read))
        .catch(error => read.emit("error", error));
    return read;
}

module.exports.setClientID = function setClientID(ID) { // Set the client_id to access the API without an oauth_token
    client_id = ID;
}

module.exports.setOauthToken = function setOauthToken(token) { // Set the oauth_token to access the API without a client_id
    oauth_token = token;
}

module.exports.getInfo = function getInfo(URL) { // GET metadata from a URL
    return new Promise((resolve, reject) => {
        fetchAPI("https://api-v2.soundcloud.com/resolve?url=" + handleExcess(URL))
            .then((response) => response.json())
            .then(resolve);
    });
}

module.exports.downloadFromInfo = function downloadFromInfo(info) { // Stream a song from its metadata
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

module.exports.validateURL = function validateURL(URL) { // Checks if a URL format matches a SoundCloud song
    URL = handleExcess(URL);
    var foo = URL.split('/');
    return (foo.length == 5 && URL.startsWith("https://soundcloud.com/")) || (foo.length == 3 && URL.startsWith("soundcloud.com/"));
}

module.exports.getPermalinkURL = function getPermalinkURL(URL) { // Formats a URL as the song's permalink URL
    if (module.exports.validateURL(URL)) {
        URL = handleExcess(URL);
        var foo = URL.split('/');
        return "https://soundcloud.com/" + foo[foo.length - 2] + "/" + foo[foo.length - 1];
    }
}

function handleExcess(URL) { // Remove fluff from URLs
    const cutoff = ['?', '#'];
    var foo = cutoff.reduce((str, chr) => str.includes(chr) ? str.substring(0, str.indexOf(chr)) : str, URL).trim().toLowerCase();
    return foo[foo.length - 1] == '/' ? foo.substring(0, foo.length - 1) : foo;
}

function fetchAPI(URL) { // Attempt to fetch with either client_id or oauth_token
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
    });
}

function getStreamableStreamURL(URL) { // Get a streamable song's streaming URL
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
