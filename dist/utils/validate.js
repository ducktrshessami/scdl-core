"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatePlaylistURL = exports.validateURL = exports.PlaylistURLPattern = exports.TrackURLPattern = void 0;
/**
 * A regular expression that matches SoundCloud track URLs
 *
 * Includes the `user`, `title`, and `secret` groups
 */
exports.TrackURLPattern = /^(?:https?:\/\/)?(?:www\.)?soundcloud\.com\/(?<user>[\w-]+)\/(?!sets(?:$|[\/?#]))(?<title>[\w-]+)\/?(?<secret>(?<=\/)s-[A-Z0-9]+)?(?:(?<!\/)\/?)(?=[?#]|$)/i;
/**
 * A regular expression that matches SoundCloud playlist URLs
 *
 * Includes the `user`, `title`, and `secret` groups
 */
exports.PlaylistURLPattern = /^(?:https?:\/\/)?(?:www\.)?soundcloud\.com\/(?<user>[\w-]+)\/sets\/(?<title>[\w-]+)\/?(?<secret>(?<=\/)s-[A-Z0-9]+)?(?:(?<!\/)\/?)(?=[?#]|$)/i;
/**
 * Checks if a string matches the SoundCloud track URL format
 */
function validateURL(url) {
    return exports.TrackURLPattern.test(url);
}
exports.validateURL = validateURL;
/**
 * Checks if a string matches the SoundCloud playlist URL format
 */
function validatePlaylistURL(url) {
    return exports.PlaylistURLPattern.test(url);
}
exports.validatePlaylistURL = validatePlaylistURL;
