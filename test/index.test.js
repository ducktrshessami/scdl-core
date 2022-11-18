const assert = require("assert");
const { fetchKey } = require("soundcloud-key-fetch");
const { Readable } = require("stream");
const scdl = require("../lib");

/***** Set URLs here *****/

const TRACK_URL = "";
const PLAYLIST_URL = "";

/***** Set URLs here *****/

before("fetching clientID", async function () {
    scdl.setClientID(await fetchKey());
});

describe("scdl", function () {
    const URL = process.env.TRACK_URL || TRACK_URL;
    if (URL) {
        it("scdl.validateURL sync checks format", function () {
            assert.strictEqual(scdl.validateURL(URL), true);
            assert.strictEqual(scdl.validateURL("https://soundcloud.com/"), false);
        });
        it("scdl.getPermalinkURL always string", function () {
            assert.strictEqual(typeof scdl.getPermalinkURL(URL), "string");
            assert.strictEqual(typeof scdl.getPermalinkURL("foobar"), "string");
        });
        it("scdl sync readable return", function () {
            assert(scdl(URL) instanceof Readable);
        });
        it("scdl stream emits transcoding", function (done) {
            this.timeout(5000);
            const output = scdl(URL);
            output.once("transcoding", () => done());
        });
        it("scdl stream populates with data", function (done) {
            this.timeout(5000);
            const output = scdl(URL);
            output.once("data", () => done());
        });
        it("scdl stream populates with data with hls protocol", function (done) {
            this.timeout(5000);
            const output = scdl(URL, { protocol: "hls" });
            output.once("data", () => done());
        });
        it("scdl.awaitDownload resolves in readable", async function () {
            this.timeout(5000);
            assert(await scdl.awaitDownload(URL) instanceof Readable);
        });
        it("scdl.awaitDownload readable has transcoding property", async function () {
            this.timeout(5000);
            const output = await scdl.awaitDownload(URL);
            assert.strictEqual(typeof output.transcoding, "object");
        });
        it("scdl.getInfo resolves in object", async function () {
            this.timeout(5000);
            assert.strictEqual(typeof await scdl.getInfo(URL), "object");
        });
        describe("from info", function () {
            let info;
            before("fetching info", async function () {
                info = await scdl.getInfo(URL);
            });
            it("scdl.downloadFromInfo sync readable return", function () {
                assert(scdl.downloadFromInfo(info) instanceof Readable);
            });
            it("scdl.downloadFromInfo stream emits transcoding", function (done) {
                this.timeout(5000);
                const output = scdl.downloadFromInfo(info);
                output.once("transcoding", () => done());
            });
            it("scdl.downloadFromInfo stream populates with data", function (done) {
                this.timeout(5000);
                const output = scdl.downloadFromInfo(info);
                output.once("data", () => done());
            });
            it("scdl.awaitDownloadFromInfo resolves in readable", async function () {
                this.timeout(5000);
                assert(await scdl.awaitDownloadFromInfo(info) instanceof Readable);
            });
            it("scdl.awaitDownloadFromInfo readable has transcoding property", async function () {
                this.timeout(5000);
                const output = await scdl.awaitDownloadFromInfo(info);
                assert.strictEqual(typeof output.transcoding, "object");
            });
        });
    }
    else {
        console.warn("TRACK_URL not found. Skipping scdl tests.\nSet the TRACK_URL env or constant in the test script to run these tests.");
        return;
    }
});

describe("scdl.playlist", function () {
    const URL = process.env.PLAYLIST_URL || PLAYLIST_URL;
    if (URL) {
        it("scdl.playlist.validateURL sync checks format", function () {
            assert.strictEqual(scdl.playlist.validateURL(URL), true);
            assert.strictEqual(scdl.validateURL("https://soundcloud.com/"), false);
        });
        it("scdl.playlist.getPermalinkURL always string", function () {
            assert.strictEqual(typeof scdl.playlist.getPermalinkURL(URL), "string");
            assert.strictEqual(typeof scdl.playlist.getPermalinkURL("foobar"), "string");
        });
        it("scdl.playlist resolves in readable? array", async function () {
            this.timeout(10000);
            const result = await scdl.playlist(URL);
            assert.strictEqual(Array.isArray(result), true);
            assert.strictEqual(result.every(item => item === null || item instanceof Readable), true);
        });
        it("scdl.playlist resolves in readable? array with hls protocol", async function () {
            this.timeout(10000);
            const result = await scdl.playlist(URL, { protocol: "hls" });
            assert.strictEqual(Array.isArray(result), true);
            assert.strictEqual(result.every(item => item === null || item instanceof Readable), true);
        });
        it("scdl.playlist readables have transcoding property", async function () {
            this.timeout(10000);
            const result = await scdl.playlist(URL);
            assert.strictEqual(result.every(item => item === null || typeof item.transcoding === "object"), true);
        });
        it("scdl.playlist.getInfo resolves in object", async function () {
            this.timeout(5000);
            assert.strictEqual(typeof await scdl.playlist.getInfo(URL), "object");
        });
        describe("from info", function () {
            let info;
            before("fetching info", async function () {
                info = await scdl.playlist.getInfo(URL);
            });
            it("scdl.playlist.downloadFromInfo resolves in readable? array", async function () {
                this.timeout(10000);
                const result = await scdl.playlist.downloadFromInfo(info);
                assert.strictEqual(Array.isArray(result), true);
                assert.strictEqual(result.every(item => item === null || item instanceof Readable), true);
            });
            it("scdl.playlist.downloadFromInfo readables have transcoding property", async function () {
                this.timeout(10000);
                const result = await scdl.playlist.downloadFromInfo(info);
                assert.strictEqual(result.every(item => item === null || typeof item.transcoding === "object"), true);
            });
        });
    }
    else {
        console.warn("PLAYLIST_URL not found. Skipping scdl.playlist tests.\nSet the PLAYLIST_URL env or constant in the test script to run these tests.");
        return;
    }
});
