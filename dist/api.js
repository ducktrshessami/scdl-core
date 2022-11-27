"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rawResolve = void 0;
const dispatch_1 = require("./dispatch");
const RESOLVE_ENDPOINT = "https://api-v2.soundcloud.com/resolve";
/**
 * Resolve info from a URL
 */
async function rawResolve(url) {
    const endpoint = new URL(RESOLVE_ENDPOINT);
    endpoint.searchParams.set("url", url);
    return (0, dispatch_1.requestWithAuth)(endpoint);
}
exports.rawResolve = rawResolve;
