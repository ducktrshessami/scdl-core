"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Quality = exports.MimeType = exports.Protocol = exports.Preset = void 0;
var Preset;
(function (Preset) {
    Preset["MP3"] = "mp3_0_1";
    Preset["OPUS"] = "opus_0_0";
})(Preset = exports.Preset || (exports.Preset = {}));
var Protocol;
(function (Protocol) {
    Protocol["PROGRESSIVE"] = "progressive";
    Protocol["HLS"] = "hls";
})(Protocol = exports.Protocol || (exports.Protocol = {}));
var MimeType;
(function (MimeType) {
    MimeType["MPEG"] = "audio/mpeg";
    MimeType["OPUS"] = "audio/ogg; codecs=\"opus\"";
})(MimeType = exports.MimeType || (exports.MimeType = {}));
var Quality;
(function (Quality) {
    Quality["SQ"] = "sq";
    /**
     * I've only seen `sq`, but I'm assuming something like this exists
     * for SoundCloud Go+ subscribers
     */
    Quality["HQ"] = "hq";
})(Quality = exports.Quality || (exports.Quality = {}));
