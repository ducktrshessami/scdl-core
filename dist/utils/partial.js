"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchPartialPlaylist = exports.isPlaylistFetched = void 0;
const api_1 = require("../api");
/**
 * Checks if all track data in a playlist has been fetched
 */
function isPlaylistFetched(info) {
    return info.data.tracks.every(track => "media" in track);
}
exports.isPlaylistFetched = isPlaylistFetched;
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
        if ("media" in track) {
            return track;
        }
        else {
            const info = await (0, api_1.rawResolve)(trackURI(track.id));
            return info;
        }
    }));
    return info;
}
exports.fetchPartialPlaylist = fetchPartialPlaylist;
