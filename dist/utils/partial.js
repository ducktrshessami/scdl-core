"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
function fetchPartialPlaylist(info) {
    return __awaiter(this, void 0, void 0, function* () {
        info.data.tracks = yield Promise.all(info.data.tracks.map((track) => __awaiter(this, void 0, void 0, function* () {
            if ("media" in track) {
                return track;
            }
            else {
                const info = yield (0, api_1.rawResolve)(trackURI(track.id));
                return info;
            }
        })));
        return info;
    });
}
exports.fetchPartialPlaylist = fetchPartialPlaylist;
