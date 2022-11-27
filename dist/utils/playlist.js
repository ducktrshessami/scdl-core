"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlaylistInfo = void 0;
const stream_1 = require("../stream");
const partial_1 = require("./partial");
class PlaylistInfo {
    constructor(data) {
        this.data = data;
    }
    /**
     * Checks if all track data has been fetched
     */
    isFetched() {
        return (0, partial_1.isPlaylistFetched)(this);
    }
    /**
     * Fetches any partial track data in this playlist
     */
    async fetchPartialTracks() {
        await (0, partial_1.fetchPartialPlaylist)(this);
        return this;
    }
    /**
     * Stream tracks from this playlist
     *
     * Fetches partial track data first
     */
    async stream() {
        return (0, stream_1.streamPlaylistFromInfo)(this);
    }
}
exports.PlaylistInfo = PlaylistInfo;
