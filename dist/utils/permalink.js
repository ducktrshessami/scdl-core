"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPlaylistPermalinkURL = exports.getPermalinkURL = void 0;
const validate_1 = require("./validate");
/**
 * Formats a URL as a track's permalink URL
 */
function getPermalinkURL(url) {
    const result = url.match(validate_1.TrackURLPattern);
    if (result) {
        const publicURL = `https://soundcloud.com/${result.groups.user}/${result.groups.title}`;
        return result.groups.secret ? publicURL + `/${result.groups.secret}` : publicURL;
    }
    else {
        return "";
    }
}
exports.getPermalinkURL = getPermalinkURL;
/**
 * Formats a URL as a playlist's permalink URL
 */
function getPlaylistPermalinkURL(url) {
    const result = url.match(validate_1.PlaylistURLPattern);
    if (result) {
        const publicURL = `https://soundcloud.com/${result.groups.user}/sets/${result.groups.title}`;
        return result.groups.secret ? publicURL + `/${result.groups.secret}` : publicURL;
    }
    else {
        return "";
    }
}
exports.getPlaylistPermalinkURL = getPlaylistPermalinkURL;
