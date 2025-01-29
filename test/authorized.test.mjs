import { fetchClientID } from "@scdl/fetch-client";
import assert from "assert";
import { beforeAll, describe, test } from "vitest";
import * as scdl from "../dist";
import { PLAYLIST_URL, TRACK_URL } from "./urls.mjs";

const trackURL = process.env.TRACK_URL || TRACK_URL;
const playlistURL = process.env.PLAYLIST_URL || PLAYLIST_URL;

function playlistTrackEmitRace(emitter, event) {
    return new Promise(resolve => {
        const callback = () => {
            emitter
                .off("error", callback)
                .off(event, callback);
            resolve();
        };
        emitter
            .once("error", callback)
            .once(event, callback);
    });
}

describe("authorized", function () {
    beforeAll(async function () {
        scdl.setClientID(await fetchClientID());
    }, 5000);

    describe.skipIf(!trackURL)("track", function () {
        test("stream readable has transcoding property", { timeout: 5000 }, async function () {
            const output = await scdl.stream(trackURL);
            assert.strictEqual(typeof output.transcoding, "object");
        });
        test("streamSync emits transcoding", { timeout: 5000 }, function () {
            return new Promise(resolve => {
                const output = scdl.streamSync(trackURL);
                output.once("transcoding", () => resolve());
            });
        });
        test("streamSync populates with data", { timeout: 5000 }, function () {
            return new Promise(resolve => {
                const output = scdl.streamSync(trackURL);
                output.once("data", () => resolve());
            });
        });
        describe("from info", function () {
            let info;
            beforeAll(async function () {
                info = await scdl.getInfo(trackURL);
            }, 5000);
            test.each([
                scdl.Protocol.PROGRESSIVE,
                scdl.Protocol.HLS
            ])("can stream %s", { timeout: 5000 }, async function (protocol) {
                await scdl.streamFromInfo(info, { protocol });
            });
            test("info is wrapped in data object for symmetry", function () {
                assert(info.data);
                assert(info.data.id);
            });
            test("streamFromInfo readable has transcoding property", { timeout: 5000 }, async function () {
                const output = await scdl.streamFromInfo(info);
                assert.strictEqual(typeof output.transcoding, "object");
            });
            test("streamFromInfoSync stream emits transcoding", { timeout: 5000 }, function () {
                return new Promise(resolve => {
                    const output = scdl.streamFromInfoSync(info);
                    output.once("transcoding", () => resolve());
                });
            });
            test("streamFromInfoSync stream populates with data", { timeout: 5000 }, function () {
                return new Promise(resolve => {
                    const output = scdl.streamFromInfoSync(info);
                    output.once("data", () => resolve());
                });
            });
        });
    });

    describe.skipIf(!playlistURL)("playlist", function () {
        test("streamPlaylist readables have transcoding property", { timeout: 60000 }, async function () {
            const result = await scdl.streamPlaylist(playlistURL);
            assert.strictEqual(result.every(item => item === null || typeof item.transcoding === "object"), true);
        });
        describe("from info", function () {
            let info;
            beforeAll(async function () {
                info = await scdl.getPlaylistInfo(playlistURL);
            }, 5000);
            test("fetchPartialPlaylist works as intended", { timeout: 60000 }, async function () {
                if (scdl.isPlaylistFetched(info)) {
                    console.warn("All track data already present. Skipping fetchPartialPlaylist test.");
                    return;
                }
                await scdl.fetchPartialPlaylist(info);
                assert.strictEqual(scdl.isPlaylistFetched(info), true);
            });
            test("streamPlaylistFromInfo readables have transcoding property", { timeout: 60000 }, async function () {
                const result = await scdl.streamPlaylistFromInfo(info);
                assert.strictEqual(result.every(item => item === null || typeof item.transcoding === "object"), true);
            });
            test("streamPlaylistFromInfoSync streams emit transcoding", { timeout: 60000 }, async function () {
                const output = scdl.streamPlaylistFromInfoSync(info);
                await Promise.all(
                    output.map(stream => playlistTrackEmitRace(stream, "transcoding"))
                );
            });
            test("streamPlaylistFromInfoSync streams populate with data", { timeout: 60000 }, async function () {
                const output = scdl.streamPlaylistFromInfoSync(info);
                await Promise.all(
                    output.map(stream => playlistTrackEmitRace(stream, "data"))
                );
            });
        });
    });
});
