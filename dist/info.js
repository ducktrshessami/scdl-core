"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPlaylistInfo = exports.getInfo = void 0;
const api_1 = require("./api");
const error_1 = require("./utils/error");
const playlist_1 = require("./utils/playlist");
const validate_1 = require("./utils/validate");
/**
 * Get a track's info
 */
async function getInfo(url) {
    if ((0, validate_1.validateURL)(url)) {
        const data = await (0, api_1.rawResolve)(url);
        return { data };
    }
    else {
        throw new error_1.ScdlError("Invalid track URL");
    }
}
exports.getInfo = getInfo;
/**
 * Get a playlist's info
 */
async function getPlaylistInfo(url) {
    if ((0, validate_1.validatePlaylistURL)(url)) {
        const data = await (0, api_1.rawResolve)(url);
        return new playlist_1.PlaylistInfo(data);
    }
    else {
        throw new error_1.ScdlError("Invalid playlist URL");
    }
}
exports.getPlaylistInfo = getPlaylistInfo;
