require("dotenv").config();
const assert = require("assert");
const scdl = require("../lib");

/***** Set URLs here *****/

const SONG_URL = "";
const PLAYLIST_URL = "";

/***** Set URLs here *****/

describe("scdl", function () {
    const URL = process.env.SONG_URL || SONG_URL;
    if (URL) {
        it("sets/gets authorization properly", function () {
            const foo = Math.random().toString();
            const bar = Math.random().toString();
            scdl.setClientID(foo);
            scdl.setOauthToken(bar);
            assert.strictEqual(scdl.clientID, foo);
            assert.strictEqual(scdl.oauthToken, bar);
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
