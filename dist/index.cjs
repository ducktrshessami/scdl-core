Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
let undici = require("undici");
let http = require("http");
let m3u_parser_generator = require("m3u-parser-generator");
let stream = require("stream");
//#region src/auth.ts
let clientID = null;
let oauthToken = null;
/**
* Set the client_id to access the API with
*/
function setClientID(id) {
	clientID = id;
}
/**
* Set the oauth_token to access the API with
* 
* This will be prioritized over a client_id
*/
function setOauthToken(token) {
	oauthToken = token;
}
/**
* Get the currently set client_id
*/
function getClientID() {
	return clientID;
}
/**
* Get the currently set oauth_token
*/
function getOauthToken() {
	return oauthToken;
}
//#endregion
//#region src/queue.ts
const DEFAULT_MAX = 20;
let queueMax = null;
/**
* Set the limit for concurrent requests
* 
* Defaults to 20
*/
function setRequestQueueLimit(limit) {
	queueMax = limit;
}
/**
* Get the limit for concurrent requests
*/
function getRequestQueueLimit() {
	return queueMax ?? DEFAULT_MAX;
}
/**
* Internal request queue
*/
var Queue = class {
	current;
	queue;
	constructor() {
		this.current = 0;
		this.queue = [];
	}
	/**
	* Wait for this to resolve before executing a queued action
	*/
	async enqueue() {
		if (this.current >= getRequestQueueLimit()) await new Promise((resolve) => this.queue.unshift(resolve));
		this.current++;
	}
	/**
	* Call this after a queued action has finished executing
	*/
	dequeue() {
		this.current--;
		this.queue.pop()?.();
	}
};
//#endregion
//#region src/utils/error.ts
var CustomError = class extends Error {
	constructor(message) {
		super(message);
		this.name = this.constructor.name;
	}
};
var ScdlError = class extends CustomError {};
var RequestError = class extends CustomError {
	constructor(statusCode) {
		super(`${statusCode} ${http.STATUS_CODES[statusCode]}`);
	}
};
//#endregion
//#region src/dispatch.ts
const DEFAULT_TIMEOUT = 3e4;
const queue = new Queue();
let dispatcher = null;
let requestTimeout = null;
/**
* Set the agent to use for requests
* 
* Defaults to the global dispatcher
*/
function setAgent(agent) {
	dispatcher = agent;
}
/**
* Get the currently set agent
*/
function getAgent() {
	return dispatcher ?? (0, undici.getGlobalDispatcher)();
}
/**
* Set the timeout for requests in milliseconds
* 
* Defaults to 30000 ms
*/
function setRequestTimeout(timeout) {
	requestTimeout = timeout;
}
/**
* Get the timeout for requests in milliseconds
*/
function getRequestTimeout() {
	return requestTimeout ?? DEFAULT_TIMEOUT;
}
/**
* Create GET request options from a URL
*/
function createRequestOptions(url) {
	const options = {
		origin: url.origin,
		path: url.pathname + url.search,
		method: "GET"
	};
	const timeout = getRequestTimeout();
	options.headersTimeout = timeout;
	options.bodyTimeout = timeout;
	return options;
}
/**
* Perform a GET request
*/
async function request(url) {
	await queue.enqueue();
	try {
		const res = await getAgent().request(createRequestOptions(url));
		if (res.statusCode < 400) return res;
		else throw new RequestError(res.statusCode);
	} finally {
		queue.dequeue();
	}
}
/**
* Perform a GET request with authentication and parse as JSON
*/
async function requestWithAuth(url) {
	const parsedUrl = new URL(url);
	switch (true) {
		case !!getOauthToken():
			parsedUrl.searchParams.set("oauth_token", getOauthToken());
			break;
		case !!getClientID():
			parsedUrl.searchParams.set("client_id", getClientID());
			break;
		default: throw new ScdlError("Authentication not set");
	}
	parsedUrl.hash = "";
	const { body } = await request(parsedUrl);
	return body.json();
}
/**
* Perform a GET request and output to an existing PassThrough
* 
* Similar to `undici.stream`, but resolves on completion rather than
* stream consumption
* @param url The URL perform a request to
* @param output The stream to write to
* @param end Whether to end the writer on completion
* @returns The output stream
*/
async function streamThrough(url, output, end = true) {
	return new Promise(async (resolve, reject) => {
		function cleanup() {
			queue.dequeue();
			if (end) output.end();
		}
		await queue.enqueue();
		getAgent().dispatch(createRequestOptions(url), {
			onRequestStart: () => output.emit("connect"),
			onResponseStart: (_, statusCode) => {
				if (statusCode >= 200 && statusCode < 300) return true;
				else {
					cleanup();
					reject(new RequestError(statusCode));
					return false;
				}
			},
			onResponseData: (_, chunk) => {
				output.write(chunk);
				return true;
			},
			onResponseEnd: () => {
				cleanup();
				resolve(output);
			},
			onResponseError: (_, err) => {
				cleanup();
				reject(err);
			}
		});
	});
}
//#endregion
//#region src/api.ts
const RESOLVE_ENDPOINT = "https://api-v2.soundcloud.com/resolve";
/**
* Resolve info from a URL
*/
async function rawResolve(url) {
	const endpoint = new URL(RESOLVE_ENDPOINT);
	endpoint.searchParams.set("url", url);
	return requestWithAuth(endpoint);
}
//#endregion
//#region src/utils/partial.ts
/**
* Checks if all track data in a playlist has been fetched
*/
function isPlaylistFetched(info) {
	return info.data.tracks.every((track) => "media" in track);
}
/**
* Creates a track URI from a track's id
* @param id The track's id
*/
function trackURI(id) {
	return `https://api.soundcloud.com/tracks/${id}`;
}
/**
* Fetches any partial track data in a playlist's info object
* 
* Track info is updated in place
* @param info Info obtained from `getPlaylistInfo`
* @returns The updated playlist info object
*/
async function fetchPartialPlaylist(info) {
	info.data.tracks = await Promise.all(info.data.tracks.map(async (track) => {
		if ("media" in track) return track;
		else return await rawResolve(trackURI(track.id));
	}));
	return info;
}
//#endregion
//#region src/utils/transcoding.ts
let Preset = /* @__PURE__ */ function(Preset) {
	Preset["MP3"] = "mp3_0_1";
	Preset["OPUS"] = "opus_0_0";
	return Preset;
}({});
let Protocol = /* @__PURE__ */ function(Protocol) {
	Protocol["PROGRESSIVE"] = "progressive";
	Protocol["HLS"] = "hls";
	return Protocol;
}({});
let MimeType = /* @__PURE__ */ function(MimeType) {
	MimeType["MPEG"] = "audio/mpeg";
	MimeType["OPUS"] = "audio/ogg; codecs=\"opus\"";
	return MimeType;
}({});
/**
* I've only seen `sq`, but I'm assuming there's a higher quality
* for SoundCloud Go+ subscribers
*/
let Quality = /* @__PURE__ */ function(Quality) {
	Quality["SQ"] = "sq";
	return Quality;
}({});
//#endregion
//#region src/stream.ts
const DEFAULT_OPTIONS = {
	strict: false,
	preset: "mp3_0_1",
	protocol: "progressive",
	mimeType: "audio/mpeg",
	quality: "sq"
};
const OPTION_WEIGHT = {
	mimeType: 1,
	preset: 1.1,
	protocol: 1.2,
	quality: 1.3
};
async function streamHls(url, output) {
	const hlsRes = await request(url);
	const { medias } = new m3u_parser_generator.M3uParser().parse(await hlsRes.body.text());
	for (const media of medias) await streamThrough(new URL(media.location), output, false);
	return output.end();
}
/**
* Create a stream from a transcoding object
* @param transcoding The transcoding to stream
* @param output Existing output stream from `streamSync`
* @returns The output stream, previously existing or not
*/
async function streamTranscoding(transcoding, output) {
	const { url: streamUrl } = await requestWithAuth(transcoding.url);
	const url = new URL(streamUrl);
	const outStream = output ?? new stream.PassThrough();
	outStream.transcoding = transcoding;
	outStream.emit("transcoding", transcoding);
	const streaming = transcoding.format.protocol === "hls" ? streamHls(url, outStream) : streamThrough(url, outStream);
	if (output) streaming.catch((err) => outStream.emit("error", err));
	else await streaming;
	return outStream;
}
/**
* Find a transcoding that matches the given options
* @param transcodings Transcodings obtained from a track's info
* @param options Transcoding search options
*/
function findTranscoding(transcodings, options) {
	if (!transcodings.length) return null;
	else if (options.strict) return transcodings.find((transcoding) => (!options.preset || transcoding.preset === options.preset) && (!options.protocol || transcoding.format.protocol === options.protocol) && (!options.mimeType || transcoding.format.mime_type === options.mimeType) && (!options.quality || transcoding.quality === options.quality)) ?? null;
	else {
		const { transcoding: best } = transcodings.reduce((currentBest, transcoding) => {
			const data = {
				preset: transcoding.preset,
				protocol: transcoding.format.protocol,
				mimeType: transcoding.format.mime_type,
				quality: transcoding.quality
			};
			const current = {
				transcoding,
				score: Object.keys(OPTION_WEIGHT).reduce((score, key) => {
					if (data[key] === options[key]) score += OPTION_WEIGHT[key];
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
async function streamEngine(info, options, output) {
	if (info.streamable === false) throw new ScdlError("Track not streamable");
	const transcoding = findTranscoding(info.media.transcodings, options);
	if (transcoding) return streamTranscoding(transcoding, output);
	else throw new ScdlError("Failed to obtain transcoding");
}
/**
* * Stream a track from its info object
* 
* Used internally by `stream`
* @param info Info obtained from `getInfo`
* @param options Transcoding search options
*/
async function streamFromInfo(info, options = DEFAULT_OPTIONS) {
	return streamEngine(info.data, options);
}
/**
* Stream a track from its URL
* @param url A track URL
* @param options Transcoding search options
*/
async function stream$1(url, options = DEFAULT_OPTIONS) {
	return streamFromInfo(await getInfo(url), options);
}
/**
* Synchronously stream a track from its URL
* @param url A track URL
* @param options Transcoding search options
*/
function streamSync(url, options = DEFAULT_OPTIONS) {
	const output = new stream.PassThrough();
	getInfo(url).then((info) => streamEngine(info.data, options, output)).catch((err) => output.emit("error", err));
	return output;
}
/**
* Synchronously stream a track from its info object
* @param info Info obtained from `getInfo`
* @param options Transcoding search options
*/
function streamFromInfoSync(info, options = DEFAULT_OPTIONS) {
	const output = new stream.PassThrough();
	streamEngine(info.data, options, output).catch((err) => output.emit("error", err));
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
async function streamPlaylistFromInfo(info, options = DEFAULT_OPTIONS) {
	await fetchPartialPlaylist(info);
	return Promise.all(info.data.tracks.map(async (track) => {
		try {
			return await streamEngine(track, options);
		} catch {
			return null;
		}
	}));
}
/**
* Stream tracks from a playlist's URL
* @param url A playlist URL
* @param options Transcoding search options
* @returns A promise that resolves in an array. Each item will be either a readable stream or `null` if streaming errored
*/
async function streamPlaylist(url, options = DEFAULT_OPTIONS) {
	return streamPlaylistFromInfo(await getPlaylistInfo(url), options);
}
/**
* Synchronously stream tracks from a playlist's info object
* @param info Info obtained from `getPlaylistInfo`
* @param options Transcoding search options
*/
function streamPlaylistFromInfoSync(info, options = DEFAULT_OPTIONS) {
	return info.data.tracks.map((track) => {
		const output = new stream.PassThrough();
		streamEngine(track, options, output).catch((err) => output.emit("error", err));
		return output;
	});
}
//#endregion
//#region src/utils/playlist.ts
var PlaylistInfo = class {
	constructor(data) {
		this.data = data;
	}
	/**
	* Checks if all track data has been fetched
	*/
	isFetched() {
		return isPlaylistFetched(this);
	}
	/**
	* Fetches any partial track data in this playlist
	*/
	async fetchPartialTracks() {
		await fetchPartialPlaylist(this);
		return this;
	}
	/**
	* Stream tracks from this playlist
	* 
	* Fetches partial track data first
	*/
	async stream() {
		return streamPlaylistFromInfo(this);
	}
};
//#endregion
//#region src/utils/validate.ts
/**
* A regular expression that matches SoundCloud track URLs
* 
* Includes the `user`, `title`, and `secret` groups
*/
const TrackURLPattern = /^(?:https?:\/\/)?(?:www\.)?soundcloud\.com\/(?<user>[\w-]+)\/(?!sets(?:$|[\/?#]))(?<title>[\w-]+)\/?(?<secret>(?<=\/)s-[A-Z0-9]+)?(?:(?<!\/)\/?)(?=[?#]|$)/i;
/**
* A regular expression that matches SoundCloud playlist URLs
* 
* Includes the `user`, `title`, and `secret` groups
*/
const PlaylistURLPattern = /^(?:https?:\/\/)?(?:www\.)?soundcloud\.com\/(?<user>[\w-]+)\/sets\/(?<title>[\w-]+)\/?(?<secret>(?<=\/)s-[A-Z0-9]+)?(?:(?<!\/)\/?)(?=[?#]|$)/i;
/**
* Checks if a string matches the SoundCloud track URL format
*/
function validateURL(url) {
	return TrackURLPattern.test(url);
}
/**
* Checks if a string matches the SoundCloud playlist URL format
*/
function validatePlaylistURL(url) {
	return PlaylistURLPattern.test(url);
}
//#endregion
//#region src/info.ts
/**
* Get a track's info
*/
async function getInfo(url) {
	if (validateURL(url)) return { data: await rawResolve(url) };
	else throw new ScdlError("Invalid track URL");
}
/**
* Get a playlist's info
*/
async function getPlaylistInfo(url) {
	if (validatePlaylistURL(url)) return new PlaylistInfo(await rawResolve(url));
	else throw new ScdlError("Invalid playlist URL");
}
//#endregion
//#region src/utils/permalink.ts
/**
* Formats a URL as a track's permalink URL
*/
function getPermalinkURL(url) {
	const result = url.match(TrackURLPattern);
	if (result) {
		const publicURL = `https://soundcloud.com/${result.groups.user}/${result.groups.title}`;
		return result.groups.secret ? publicURL + `/${result.groups.secret}` : publicURL;
	} else return "";
}
/**
* Formats a URL as a playlist's permalink URL
*/
function getPlaylistPermalinkURL(url) {
	const result = url.match(PlaylistURLPattern);
	if (result) {
		const publicURL = `https://soundcloud.com/${result.groups.user}/sets/${result.groups.title}`;
		return result.groups.secret ? publicURL + `/${result.groups.secret}` : publicURL;
	} else return "";
}
//#endregion
exports.MimeType = MimeType;
exports.PlaylistURLPattern = PlaylistURLPattern;
exports.Preset = Preset;
exports.Protocol = Protocol;
exports.Quality = Quality;
exports.TrackURLPattern = TrackURLPattern;
exports.fetchPartialPlaylist = fetchPartialPlaylist;
exports.getAgent = getAgent;
exports.getClientID = getClientID;
exports.getInfo = getInfo;
exports.getOauthToken = getOauthToken;
exports.getPermalinkURL = getPermalinkURL;
exports.getPlaylistInfo = getPlaylistInfo;
exports.getPlaylistPermalinkURL = getPlaylistPermalinkURL;
exports.getRequestQueueLimit = getRequestQueueLimit;
exports.getRequestTimeout = getRequestTimeout;
exports.isPlaylistFetched = isPlaylistFetched;
exports.rawResolve = rawResolve;
exports.setAgent = setAgent;
exports.setClientID = setClientID;
exports.setOauthToken = setOauthToken;
exports.setRequestQueueLimit = setRequestQueueLimit;
exports.setRequestTimeout = setRequestTimeout;
exports.stream = stream$1;
exports.streamFromInfo = streamFromInfo;
exports.streamFromInfoSync = streamFromInfoSync;
exports.streamPlaylist = streamPlaylist;
exports.streamPlaylistFromInfo = streamPlaylistFromInfo;
exports.streamPlaylistFromInfoSync = streamPlaylistFromInfoSync;
exports.streamSync = streamSync;
exports.validatePlaylistURL = validatePlaylistURL;
exports.validateURL = validateURL;

//# sourceMappingURL=index.cjs.map