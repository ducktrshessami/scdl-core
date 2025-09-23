import assert from "assert";
import { describe, test } from "vitest";
import * as scdl from "../dist/index.mjs";
import { PLAYLIST_URL, TRACK_URL } from "./urls.mjs";

const trackURL = process.env.TRACK_URL || TRACK_URL;
const playlistURL = process.env.PLAYLIST_URL || PLAYLIST_URL;

describe.skipIf(!trackURL)("track", function () {
    test("TrackURLPattern matches groups properly", function () {
        const result = trackURL.match(scdl.TrackURLPattern);
        assert(result);
        assert.strictEqual(typeof result.groups?.user, "string");
        assert.strictEqual(typeof result.groups?.title, "string");
    });
    test("validateURL sync checks format", function () {
        assert.strictEqual(scdl.validateURL(trackURL), true);
        assert.strictEqual(scdl.validateURL("https://soundcloud.com/"), false);
    });
    test("getPermalinkURL always string", function () {
        assert.strictEqual(typeof scdl.getPermalinkURL(trackURL), "string");
        assert.strictEqual(typeof scdl.getPermalinkURL("foobar"), "string");
    });
});

describe.skipIf(!playlistURL)("playlist", function () {
    test("PlaylistURLPattern matches groups properly", function () {
        const result = playlistURL.match(scdl.PlaylistURLPattern);
        assert(result);
        assert.strictEqual(typeof result.groups?.user, "string");
        assert.strictEqual(typeof result.groups?.title, "string");
    });
    test("validatePlaylistURL sync checks format", function () {
        assert.strictEqual(scdl.validatePlaylistURL(playlistURL), true);
        assert.strictEqual(scdl.validatePlaylistURL("https://soundcloud.com/"), false);
    });
    test("getPlaylistPermalinkURL always string", function () {
        assert.strictEqual(typeof scdl.getPlaylistPermalinkURL(playlistURL), "string");
        assert.strictEqual(typeof scdl.getPlaylistPermalinkURL("foobar"), "string");
    });
});
