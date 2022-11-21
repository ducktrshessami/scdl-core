const assert = require("assert");
const { fetchKey } = require("soundcloud-key-fetch");
const scdl = require("../dist");
const { TRACK_URL } = require("./urls");

before("fetching clientID", async function () {
    scdl.setClientID(await fetchKey());
});

describe("track", function () {
    const URL = process.env.TRACK_URL || TRACK_URL;
    if (!URL) {
        console.warn("TRACK_URL not found. Skipping scdl tests.");
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
            info = await scdl.getInfo(URL);
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
