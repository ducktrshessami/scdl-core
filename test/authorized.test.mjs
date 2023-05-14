import assert from "assert";
import { fetchKey } from "soundcloud-key-fetch";
import * as scdl from "../dist/index.mjs";
import { TRACK_URL, PLAYLIST_URL } from "./urls.js";

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

describe("ESM", function () {
    before("fetching clientID", async function () {
        this.timeout(5000);
        scdl.setClientID(await fetchKey());
    });

    describe("track", function () {
        const URL = process.env.TRACK_URL || TRACK_URL;
        if (!URL) {
            console.warn("TRACK_URL not found. Skipping track tests.");
            return;
        }
        it("stream readable has transcoding property", async function () {
            this.timeout(5000);
            const output = await scdl.stream(URL);
            assert.strictEqual(typeof output.transcoding, "object");
        });
        it("streamSync emits transcoding", function (done) {
            this.timeout(5000);
            const output = scdl.streamSync(URL);
            output.once("transcoding", () => done());
        });
        it("streamSync populates with data", function (done) {
            this.timeout(5000);
            const output = scdl.streamSync(URL);
            output.once("data", () => done());
        });
        describe("from info", function () {
            let info;
            before("fetching info", async function () {
                this.timeout(5000);
                info = await scdl.getInfo(URL);
            });
            it("can stream both progressive and hls", async function () {
                this.timeout(5000);
                await Promise.all([
                    scdl.streamFromInfo(info, { protocol: scdl.Protocol.PROGRESSIVE }),
                    scdl.streamFromInfo(info, { protocol: scdl.Protocol.HLS })
                ]);
            });
            it("info is wrapped in data object for symmetry", function () {
                assert(info.data);
                assert(info.data.id);
            });
            it("streamFromInfo readable has transcoding property", async function () {
                this.timeout(5000);
                const output = await scdl.streamFromInfo(info);
                assert.strictEqual(typeof output.transcoding, "object");
            });
            it("streamFromInfoSync stream emits transcoding", function (done) {
                this.timeout(5000);
                const output = scdl.streamFromInfoSync(info);
                output.once("transcoding", () => done());
            });
            it("streamFromInfoSync stream populates with data", function (done) {
                this.timeout(5000);
                const output = scdl.streamFromInfoSync(info);
                output.once("data", () => done());
            });
        });
    });

    describe("playlist", function () {
        const URL = process.env.PLAYLIST_URL || PLAYLIST_URL;
        if (!URL) {
            console.warn("PLAYLIST_URL not found. Skipping playlist tests.");
            return;
        }
        it("streamPlaylist readables have transcoding property", async function () {
            this.timeout(60000);
            const result = await scdl.streamPlaylist(URL);
            assert.strictEqual(result.every(item => item === null || typeof item.transcoding === "object"), true);
        });
        describe("from info", function () {
            let info;
            before("fetching info", async function () {
                this.timeout(5000);
                info = await scdl.getPlaylistInfo(URL);
            });
            it("fetchPartialPlaylist works as intended", async function () {
                this.timeout(60000);
                if (scdl.isPlaylistFetched(info)) {
                    console.warn("All track data already present. Skipping fetchPartialPlaylist test.");
                    return;
                }
                await scdl.fetchPartialPlaylist(info);
                assert.strictEqual(scdl.isPlaylistFetched(info), true);
            });
            it("streamPlaylistFromInfo readables have transcoding property", async function () {
                this.timeout(60000);
                const result = await scdl.streamPlaylistFromInfo(info);
                assert.strictEqual(result.every(item => item === null || typeof item.transcoding === "object"), true);
            });
            it("streamPlaylistFromInfoSync streams emit transcoding", async function () {
                this.timeout(60000);
                const output = scdl.streamPlaylistFromInfoSync(info);
                await Promise.all(
                    output.map(stream => playlistTrackEmitRace(stream, "transcoding"))
                );
            });
            it("streamPlaylistFromInfoSync streams populate with data", async function () {
                this.timeout(60000);
                const output = scdl.streamPlaylistFromInfoSync(info);
                await Promise.all(
                    output.map(stream => playlistTrackEmitRace(stream, "data"))
                );
            });
        });
    });
});
