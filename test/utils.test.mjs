import assert from "assert";
import { describe, test } from "vitest";
import * as scdl from "../dist/index.mjs";
import { PLAYLIST_URL, TRACK_URL } from "./urls.mjs";

describe("track", function () {
    const URL = process.env.TRACK_URL || TRACK_URL;
    if (!URL) {
        console.warn("TRACK_URL not found. Skipping track tests.");
        return;
    }
    test("TrackURLPattern matches groups properly", function () {
        const result = URL.match(scdl.TrackURLPattern);
        assert(result);
        assert.strictEqual(typeof result.groups?.user, "string");
        assert.strictEqual(typeof result.groups?.title, "string");
    });
    test("validateURL sync checks format", function () {
        assert.strictEqual(scdl.validateURL(URL), true);
        assert.strictEqual(scdl.validateURL("https://soundcloud.com/"), false);
    });
    test("getPermalinkURL always string", function () {
        assert.strictEqual(typeof scdl.getPermalinkURL(URL), "string");
        assert.strictEqual(typeof scdl.getPermalinkURL("foobar"), "string");
    });
});

describe("playlist", function () {
    const URL = process.env.PLAYLIST_URL || PLAYLIST_URL;
    if (!URL) {
        console.warn("PLAYLIST_URL not found. Skipping playlist tests.");
        return;
    }
    test("PlaylistURLPattern matches groups properly", function () {
        const result = URL.match(scdl.PlaylistURLPattern);
        assert(result);
        assert.strictEqual(typeof result.groups?.user, "string");
        assert.strictEqual(typeof result.groups?.title, "string");
    });
    test("validatePlaylistURL sync checks format", function () {
        assert.strictEqual(scdl.validatePlaylistURL(URL), true);
        assert.strictEqual(scdl.validatePlaylistURL("https://soundcloud.com/"), false);
    });
    test("getPlaylistPermalinkURL always string", function () {
        assert.strictEqual(typeof scdl.getPlaylistPermalinkURL(URL), "string");
        assert.strictEqual(typeof scdl.getPlaylistPermalinkURL("foobar"), "string");
    });
});
