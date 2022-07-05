require("dotenv").config();
const assert = require("assert");
const { fetchKey } = require("soundcloud-key-fetch");
const { Readable } = require("stream");
const scdl = require("../lib");

/***** Set URLs here *****/

const SONG_URL = "";
const PLAYLIST_URL = "";

/***** Set URLs here *****/

before("fetching clientID", async function () {
    scdl.clientID = await fetchKey();
});

describe("scdl", function () {
    const URL = process.env.SONG_URL || SONG_URL;
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
        it("scdl stream populates with data", function (done) {
            this.timeout(5000);
            const output = scdl(URL);
            output.once("data", () => done());
        });
        it("scdl.awaitDownload resolves in readable", async function () {
            this.timeout(5000);
            assert(await scdl.awaitDownload(URL) instanceof Readable);
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
            it("scdl.downloadFromInfo stream populates with data", function (done) {
                this.timeout(5000);
                const output = scdl.downloadFromInfo(info);
                output.once("data", () => done());
            });
            it("scdl.awaitDownloadFromInfo resolves in readable", async function () {
                this.timeout(5000);
                assert(await scdl.awaitDownloadFromInfo(info) instanceof Readable);
            });
        });
    }
    else {
        console.warn("SONG_URL not found. Skipping scdl tests.\nSet the SONG_URL env or constant in the test script to run these tests.");
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
        it("scdl.playlist resolves in readable array", async function () {
            this.timeout(5000);
            const result = await scdl.playlist(URL);
            assert.strictEqual(Array.isArray(result), true);
            assert.strictEqual(result.every(item => item instanceof Readable), true);
        });
    }
    else {
        console.warn("PLAYLIST_URL not found. Skipping scdl.playlist tests.\nSet the PLAYLIST_URL env or constant in the test script to run these tests.");
        return;
    }
});
