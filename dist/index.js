"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  MimeType: () => MimeType,
  PlaylistURLPattern: () => PlaylistURLPattern,
  Preset: () => Preset,
  Protocol: () => Protocol,
  Quality: () => Quality,
  TrackURLPattern: () => TrackURLPattern,
  fetchPartialPlaylist: () => fetchPartialPlaylist,
  getAgent: () => getAgent,
  getClientID: () => getClientID,
  getInfo: () => getInfo,
  getOauthToken: () => getOauthToken,
  getPermalinkURL: () => getPermalinkURL,
  getPlaylistInfo: () => getPlaylistInfo,
  getPlaylistPermalinkURL: () => getPlaylistPermalinkURL,
  getRequestQueueLimit: () => getRequestQueueLimit,
  getRequestTimeout: () => getRequestTimeout,
  isPlaylistFetched: () => isPlaylistFetched,
  rawResolve: () => rawResolve,
  setAgent: () => setAgent,
  setClientID: () => setClientID,
  setOauthToken: () => setOauthToken,
  setRequestQueueLimit: () => setRequestQueueLimit,
  setRequestTimeout: () => setRequestTimeout,
  stream: () => stream,
  streamFromInfo: () => streamFromInfo,
  streamFromInfoSync: () => streamFromInfoSync,
  streamPlaylist: () => streamPlaylist,
  streamPlaylistFromInfo: () => streamPlaylistFromInfo,
  streamPlaylistFromInfoSync: () => streamPlaylistFromInfoSync,
  streamSync: () => streamSync,
  validatePlaylistURL: () => validatePlaylistURL,
  validateURL: () => validateURL
});
module.exports = __toCommonJS(src_exports);

// src/dispatch.ts
var import_undici = require("undici");

// src/auth.ts
var clientID = null;
var oauthToken = null;
function setClientID(id) {
  clientID = id;
}
function setOauthToken(token) {
  oauthToken = token;
}
function getClientID() {
  return clientID;
}
function getOauthToken() {
  return oauthToken;
}

// src/utils/error.ts
var import_http = require("http");
var CustomError = class extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
  }
};
var ScdlError = class extends CustomError {
};
var RequestError = class extends CustomError {
  constructor(statusCode) {
    super(`${statusCode} ${import_http.STATUS_CODES[statusCode]}`);
  }
};

// src/queue.ts
var DEFAULT_MAX = 20;
var queueMax = null;
function setRequestQueueLimit(limit) {
  queueMax = limit;
}
function getRequestQueueLimit() {
  return queueMax ?? DEFAULT_MAX;
}
var Queue = class {
  constructor() {
    this.current = 0;
    this.queue = [];
  }
  /**
   * Wait for this to resolve before executing a queued action
   */
  async enqueue() {
    if (this.current >= getRequestQueueLimit()) {
      await new Promise((resolve) => this.queue.unshift(resolve));
    }
    this.current++;
  }
  /**
   * Call this after a queued action has finished executing
   */
  dequeue() {
    this.current--;
    const next = this.queue.pop();
    next?.();
  }
};

// src/dispatch.ts
var DEFAULT_TIMEOUT = 3e4;
var queue = new Queue();
var dispatcher = null;
var requestTimeout = null;
function setAgent(agent) {
  dispatcher = agent;
}
function getAgent() {
  return dispatcher ?? (0, import_undici.getGlobalDispatcher)();
}
function setRequestTimeout(timeout) {
  requestTimeout = timeout;
}
function getRequestTimeout() {
  return requestTimeout ?? DEFAULT_TIMEOUT;
}
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
async function request(url) {
  await queue.enqueue();
  try {
    const res = await getAgent().request(createRequestOptions(url));
    if (res.statusCode < 400) {
      return res;
    } else {
      throw new RequestError(res.statusCode);
    }
  } finally {
    queue.dequeue();
  }
}
async function requestWithAuth(url) {
  const parsedUrl = new URL(url);
  switch (true) {
    case !!getOauthToken():
      parsedUrl.searchParams.set("oauth_token", getOauthToken());
      break;
    case !!getClientID():
      parsedUrl.searchParams.set("client_id", getClientID());
      break;
    default:
      throw new ScdlError("Authentication not set");
  }
  parsedUrl.hash = "";
  const { body } = await request(parsedUrl);
  return body.json();
}
async function streamThrough(url, output, end = true) {
  return new Promise(async (resolve, reject) => {
    function cleanup() {
      queue.dequeue();
      if (end) {
        output.end();
      }
    }
    await queue.enqueue();
    getAgent().dispatch(createRequestOptions(url), {
      onConnect: () => output.emit("connect"),
      onHeaders: (statusCode) => {
        if (statusCode < 400) {
          return true;
        } else {
          cleanup();
          reject(new RequestError(statusCode));
          return false;
        }
      },
      onData: (chunk) => {
        output.write(chunk);
        return true;
      },
      onComplete: () => {
        cleanup();
        resolve(output);
      },
      onError: (err) => {
        cleanup();
        reject(err);
      }
    });
  });
}

// src/api.ts
var RESOLVE_ENDPOINT = "https://api-v2.soundcloud.com/resolve";
async function rawResolve(url) {
  const endpoint = new URL(RESOLVE_ENDPOINT);
  endpoint.searchParams.set("url", url);
  return requestWithAuth(endpoint);
}

// src/stream.ts
var import_m3u_parser_generator = require("m3u-parser-generator");
var import_stream = require("stream");

// src/utils/partial.ts
function isPlaylistFetched(info) {
  return info.data.tracks.every((track) => "media" in track);
}
function trackURI(id) {
  return `https://api.soundcloud.com/tracks/${id}`;
}
async function fetchPartialPlaylist(info) {
  info.data.tracks = await Promise.all(
    info.data.tracks.map(async (track) => {
      if ("media" in track) {
        return track;
      } else {
        const info2 = await rawResolve(trackURI(track.id));
        return info2;
      }
    })
  );
  return info;
}

// src/utils/transcoding.ts
var Preset = /* @__PURE__ */ ((Preset2) => {
  Preset2["MP3"] = "mp3_0_1";
  Preset2["OPUS"] = "opus_0_0";
  return Preset2;
})(Preset || {});
var Protocol = /* @__PURE__ */ ((Protocol2) => {
  Protocol2["PROGRESSIVE"] = "progressive";
  Protocol2["HLS"] = "hls";
  return Protocol2;
})(Protocol || {});
var MimeType = /* @__PURE__ */ ((MimeType2) => {
  MimeType2["MPEG"] = "audio/mpeg";
  MimeType2["OPUS"] = 'audio/ogg; codecs="opus"';
  return MimeType2;
})(MimeType || {});
var Quality = /* @__PURE__ */ ((Quality2) => {
  Quality2["SQ"] = "sq";
  Quality2["HQ"] = "hq";
  return Quality2;
})(Quality || {});

// src/stream.ts
var DEFAULT_OPTIONS = {
  strict: false,
  preset: "mp3_0_1" /* MP3 */,
  protocol: "progressive" /* PROGRESSIVE */,
  mimeType: "audio/mpeg" /* MPEG */,
  quality: "sq" /* SQ */
};
var OPTION_WEIGHT = {
  mimeType: 1,
  preset: 1.1,
  protocol: 1.2,
  quality: 1.3
};
async function streamHls(url, output) {
  const hlsRes = await request(url);
  const { medias } = import_m3u_parser_generator.M3uParser.parse(await hlsRes.body.text());
  for (const media of medias) {
    await streamThrough(new URL(media.location), output, false);
  }
  return output.end();
}
async function streamTranscoding(transcoding, output) {
  const { url: streamUrl } = await requestWithAuth(transcoding.url);
  const url = new URL(streamUrl);
  const outStream = output ?? new import_stream.PassThrough();
  outStream.transcoding = transcoding;
  outStream.emit("transcoding", transcoding);
  const streaming = transcoding.format.protocol === "hls" /* HLS */ ? streamHls(url, outStream) : streamThrough(url, outStream);
  if (output) {
    streaming.catch((err) => outStream.emit("error", err));
  } else {
    await streaming;
  }
  return outStream;
}
function findTranscoding(transcodings, options) {
  if (!transcodings.length) {
    return null;
  } else if (options.strict) {
    return transcodings.find(
      (transcoding) => (!options.preset || transcoding.preset === options.preset) && (!options.protocol || transcoding.format.protocol === options.protocol) && (!options.mimeType || transcoding.format.mime_type === options.mimeType) && (!options.quality || transcoding.quality === options.quality)
    ) ?? null;
  } else {
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
    return best ?? transcodings[0];
  }
}
async function streamEngine(info, options, output) {
  if (info.streamable === false) {
    throw new ScdlError("Track not streamable");
  }
  const transcoding = findTranscoding(info.media.transcodings, options);
  if (transcoding) {
    return streamTranscoding(transcoding, output);
  } else {
    throw new ScdlError("Failed to obtain transcoding");
  }
}
async function streamFromInfo(info, options = DEFAULT_OPTIONS) {
  return streamEngine(info.data, options);
}
async function stream(url, options = DEFAULT_OPTIONS) {
  const info = await getInfo(url);
  return streamFromInfo(info, options);
}
function streamSync(url, options = DEFAULT_OPTIONS) {
  const output = new import_stream.PassThrough();
  getInfo(url).then((info) => streamEngine(info.data, options, output)).catch((err) => output.emit("error", err));
  return output;
}
function streamFromInfoSync(info, options = DEFAULT_OPTIONS) {
  const output = new import_stream.PassThrough();
  streamEngine(info.data, options, output).catch((err) => output.emit("error", err));
  return output;
}
async function streamPlaylistFromInfo(info, options = DEFAULT_OPTIONS) {
  await fetchPartialPlaylist(info);
  return Promise.all(
    info.data.tracks.map(async (track) => {
      try {
        return await streamEngine(track, options);
      } catch {
        return null;
      }
    })
  );
}
async function streamPlaylist(url, options = DEFAULT_OPTIONS) {
  const info = await getPlaylistInfo(url);
  return streamPlaylistFromInfo(info, options);
}
function streamPlaylistFromInfoSync(info, options = DEFAULT_OPTIONS) {
  return info.data.tracks.map((track) => {
    const output = new import_stream.PassThrough();
    streamEngine(track, options, output).catch((err) => output.emit("error", err));
    return output;
  });
}

// src/utils/playlist.ts
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

// src/utils/validate.ts
var TrackURLPattern = /^(?:https?:\/\/)?(?:www\.)?soundcloud\.com\/(?<user>[\w-]+)\/(?!sets(?:$|[\/?#]))(?<title>[\w-]+)\/?(?<secret>(?<=\/)s-[A-Z0-9]+)?(?:(?<!\/)\/?)(?=[?#]|$)/i;
var PlaylistURLPattern = /^(?:https?:\/\/)?(?:www\.)?soundcloud\.com\/(?<user>[\w-]+)\/sets\/(?<title>[\w-]+)\/?(?<secret>(?<=\/)s-[A-Z0-9]+)?(?:(?<!\/)\/?)(?=[?#]|$)/i;
function validateURL(url) {
  return TrackURLPattern.test(url);
}
function validatePlaylistURL(url) {
  return PlaylistURLPattern.test(url);
}

// src/info.ts
async function getInfo(url) {
  if (validateURL(url)) {
    const data = await rawResolve(url);
    return { data };
  } else {
    throw new ScdlError("Invalid track URL");
  }
}
async function getPlaylistInfo(url) {
  if (validatePlaylistURL(url)) {
    const data = await rawResolve(url);
    return new PlaylistInfo(data);
  } else {
    throw new ScdlError("Invalid playlist URL");
  }
}

// src/utils/permalink.ts
function getPermalinkURL(url) {
  const result = url.match(TrackURLPattern);
  if (result) {
    const publicURL = `https://soundcloud.com/${result.groups.user}/${result.groups.title}`;
    return result.groups.secret ? publicURL + `/${result.groups.secret}` : publicURL;
  } else {
    return "";
  }
}
function getPlaylistPermalinkURL(url) {
  const result = url.match(PlaylistURLPattern);
  if (result) {
    const publicURL = `https://soundcloud.com/${result.groups.user}/sets/${result.groups.title}`;
    return result.groups.secret ? publicURL + `/${result.groups.secret}` : publicURL;
  } else {
    return "";
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  MimeType,
  PlaylistURLPattern,
  Preset,
  Protocol,
  Quality,
  TrackURLPattern,
  fetchPartialPlaylist,
  getAgent,
  getClientID,
  getInfo,
  getOauthToken,
  getPermalinkURL,
  getPlaylistInfo,
  getPlaylistPermalinkURL,
  getRequestQueueLimit,
  getRequestTimeout,
  isPlaylistFetched,
  rawResolve,
  setAgent,
  setClientID,
  setOauthToken,
  setRequestQueueLimit,
  setRequestTimeout,
  stream,
  streamFromInfo,
  streamFromInfoSync,
  streamPlaylist,
  streamPlaylistFromInfo,
  streamPlaylistFromInfoSync,
  streamSync,
  validatePlaylistURL,
  validateURL
});
//# sourceMappingURL=index.js.map