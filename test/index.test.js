const assert = require("assert");
const { fetchKey } = require("soundcloud-key-fetch");
const { Readable } = require("stream");
const scdl = require("../dist");

/***** Set URLs here *****/

const TRACK_URL = "";
const PLAYLIST_URL = "";

/***** Set URLs here *****/

before("fetching clientID", async function () {
    scdl.setClientID(await fetchKey());
});

describe("track", function () {
    const URL = process.env.TRACK_URL || TRACK_URL;
    if (URL) {
        it("validateURL sync checks format", function () {
            assert.strictEqual(scdl.validateURL(URL), true);
            assert.strictEqual(scdl.validateURL("https://soundcloud.com/"), false);
        });
        it("getPermalinkURL always string", function () {
            assert.strictEqual(typeof scdl.getPermalinkURL(URL), "string");
            assert.strictEqual(typeof scdl.getPermalinkURL("foobar"), "string");
        });
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
        it("streamSync populates with data with hls protocol", function (done) {
            this.timeout(5000);
            const output = scdl.streamSync(URL, { protocol: "hls" });
            output.once("data", () => done());
        });
        describe("from info", function () {
            let info;
            before("fetching info", async function () {
                info = await scdl.getInfo(URL);
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
    }
    else {
        console.warn("TRACK_URL not found. Skipping scdl tests.\nSet the TRACK_URL env or constant in the test script to run these tests.");
        return;
    }
});

// describe("scdl.playlist", function () {
//     const URL = process.env.PLAYLIST_URL || PLAYLIST_URL;
//     if (URL) {
//         it("scdl.playlist.validateURL sync checks format", function () {
//             assert.strictEqual(scdl.playlist.validateURL(URL), true);
//             assert.strictEqual(scdl.validateURL("https://soundcloud.com/"), false);
//         });
//         it("scdl.playlist.getPermalinkURL always string", function () {
//             assert.strictEqual(typeof scdl.playlist.getPermalinkURL(URL), "string");
//             assert.strictEqual(typeof scdl.playlist.getPermalinkURL("foobar"), "string");
//         });
//         it("scdl.playlist resolves in readable? array", async function () {
//             this.timeout(10000);
//             const result = await scdl.playlist(URL);
//             assert.strictEqual(Array.isArray(result), true);
//             assert.strictEqual(result.every(item => item === null || item instanceof Readable), true);
//         });
//         it("scdl.playlist resolves in readable? array with hls protocol", async function () {
//             this.timeout(10000);
//             const result = await scdl.playlist(URL, { protocol: "hls" });
//             assert.strictEqual(Array.isArray(result), true);
//             assert.strictEqual(result.every(item => item === null || item instanceof Readable), true);
//         });
//         it("scdl.playlist readables have transcoding property", async function () {
//             this.timeout(10000);
//             const result = await scdl.playlist(URL);
//             assert.strictEqual(result.every(item => item === null || typeof item.transcoding === "object"), true);
//         });
//         it("scdl.playlist.getInfo resolves in object", async function () {
//             this.timeout(5000);
//             assert.strictEqual(typeof await scdl.playlist.getInfo(URL), "object");
//         });
//         describe("from info", function () {
//             let info;
//             before("fetching info", async function () {
//                 info = await scdl.playlist.getInfo(URL);
//             });
//             it("scdl.playlist.downloadFromInfo resolves in readable? array", async function () {
//                 this.timeout(10000);
//                 const result = await scdl.playlist.downloadFromInfo(info);
//                 assert.strictEqual(Array.isArray(result), true);
//                 assert.strictEqual(result.every(item => item === null || item instanceof Readable), true);
//             });
//             it("scdl.playlist.downloadFromInfo readables have transcoding property", async function () {
//                 this.timeout(10000);
//                 const result = await scdl.playlist.downloadFromInfo(info);
//                 assert.strictEqual(result.every(item => item === null || typeof item.transcoding === "object"), true);
//             });
//         });
//     }
//     else {
//         console.warn("PLAYLIST_URL not found. Skipping scdl.playlist tests.\nSet the PLAYLIST_URL env or constant in the test script to run these tests.");
//         return;
//     }
// });
