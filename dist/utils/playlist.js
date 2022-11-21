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
    fetchPartialTracks() {
        return __awaiter(this, void 0, void 0, function* () {
            yield (0, partial_1.fetchPartialPlaylist)(this);
            return this;
        });
    }
    /**
     * Stream tracks from this playlist
     *
     * Fetches partial track data first
     */
    stream() {
        return __awaiter(this, void 0, void 0, function* () {
            return (0, stream_1.streamPlaylistFromInfo)(this);
        });
    }
}
exports.PlaylistInfo = PlaylistInfo;
