require("dotenv").config();
const assert = require("assert");
const { fetchKey } = require("soundcloud-key-fetch");
const { Readable } = require("stream");
const scdl = require("../lib");

/***** Set URLs here *****/

const SONG_URL = "";
const PLAYLIST_URL = "";

/***** Set URLs here *****/

describe("scdl", function () {
    const URL = process.env.SONG_URL || SONG_URL;
    if (URL) {
        before("fetching clientID", async function () {
            scdl.clientID = await fetchKey();
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
            assert(typeof await scdl.getInfo(URL) === "object");
        });
        describe("from info", function () {
            let info;
            before("fetching info", async function () {
                info = await scdl.getInfo(URL);
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

    }
    else {
        console.warn("PLAYLIST_URL not found. Skipping scdl.playlist tests.\nSet the PLAYLIST_URL env or constant in the test script to run these tests.");
        return;
    }
});
