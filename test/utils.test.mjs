import assert from "assert";
import * as scdl from "../dist/index.mjs";
import { PLAYLIST_URL, TRACK_URL } from "./urls.js";

describe("utils [ESM]", function () {
    describe("track", function () {
        const URL = process.env.TRACK_URL || TRACK_URL;
        if (!URL) {
            console.warn("TRACK_URL not found. Skipping track tests.");
            return;
        }
        it("TrackURLPattern matches groups properly", function () {
            const result = URL.match(scdl.TrackURLPattern);
            assert(result);
            assert.strictEqual(typeof result.groups?.user, "string");
            assert.strictEqual(typeof result.groups?.title, "string");
        });
        it("validateURL sync checks format", function () {
            assert.strictEqual(scdl.validateURL(URL), true);
            assert.strictEqual(scdl.validateURL("https://soundcloud.com/"), false);
        });
        it("getPermalinkURL always string", function () {
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
        it("PlaylistURLPattern matches groups properly", function () {
            const result = URL.match(scdl.PlaylistURLPattern);
            assert(result);
            assert.strictEqual(typeof result.groups?.user, "string");
            assert.strictEqual(typeof result.groups?.title, "string");
        });
        it("validatePlaylistURL sync checks format", function () {
            assert.strictEqual(scdl.validatePlaylistURL(URL), true);
            assert.strictEqual(scdl.validatePlaylistURL("https://soundcloud.com/"), false);
        });
        it("getPlaylistPermalinkURL always string", function () {
            assert.strictEqual(typeof scdl.getPlaylistPermalinkURL(URL), "string");
            assert.strictEqual(typeof scdl.getPlaylistPermalinkURL("foobar"), "string");
        });
    });
});
