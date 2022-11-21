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
exports.getPlaylistInfo = exports.getInfo = void 0;
const api_1 = require("./api");
const error_1 = require("./utils/error");
const playlist_1 = require("./utils/playlist");
const validate_1 = require("./utils/validate");
/**
 * Get a track's info
 */
function getInfo(url) {
    return __awaiter(this, void 0, void 0, function* () {
        if ((0, validate_1.validateURL)(url)) {
            const data = yield (0, api_1.rawResolve)(url);
            return { data };
        }
        else {
            throw new error_1.ScdlError("Invalid track URL");
        }
    });
}
exports.getInfo = getInfo;
/**
 * Get a playlist's info
 */
function getPlaylistInfo(url) {
    return __awaiter(this, void 0, void 0, function* () {
        if ((0, validate_1.validatePlaylistURL)(url)) {
            const data = yield (0, api_1.rawResolve)(url);
            return new playlist_1.PlaylistInfo(data);
        }
        else {
            throw new error_1.ScdlError("Invalid playlist URL");
        }
    });
}
exports.getPlaylistInfo = getPlaylistInfo;
