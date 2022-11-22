"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.streamThrough = exports.requestWithAuth = exports.request = exports.getRequestQueueLimit = exports.setRequestQueueLimit = exports.getRequestTimeout = exports.setRequestTimeout = exports.getAgent = exports.setAgent = void 0;
const crypto_1 = require("crypto");
const promises_1 = require("timers/promises");
const undici_1 = require("undici");
const auth_1 = require("./auth");
const error_1 = require("./utils/error");
const DEFAULT_MAX = 20;
const DEFAULT_TIMEOUT = 30000;
const queue = new Set();
let dispatcher = null;
let requestTimeout = null;
let queueMax = null;
/**
 * Set the agent to use for requests
 *
 * Defaults to the global dispatcher
 */
function setAgent(agent) {
    dispatcher = agent;
}
exports.setAgent = setAgent;
/**
 * Get the currently set agent
 */
function getAgent() {
    return dispatcher !== null && dispatcher !== void 0 ? dispatcher : (0, undici_1.getGlobalDispatcher)();
}
exports.getAgent = getAgent;
/**
 * Set the timeout for requests in milliseconds
 *
 * Defaults to 30000 ms
 */
function setRequestTimeout(timeout) {
    requestTimeout = timeout;
}
exports.setRequestTimeout = setRequestTimeout;
/**
 * Get the timeout for requests in milliseconds
 */
function getRequestTimeout() {
    return requestTimeout !== null && requestTimeout !== void 0 ? requestTimeout : DEFAULT_TIMEOUT;
}
exports.getRequestTimeout = getRequestTimeout;
/**
 * Set the limit for concurrent requests
 *
 * Defaults to 20
 */
function setRequestQueueLimit(limit) {
    queueMax = limit;
}
exports.setRequestQueueLimit = setRequestQueueLimit;
/**
 * Get the limit for concurrent requests
 */
function getRequestQueueLimit() {
    return queueMax !== null && queueMax !== void 0 ? queueMax : DEFAULT_MAX;
}
exports.getRequestQueueLimit = getRequestQueueLimit;
/**
 * Create GET request options from a URL
 */
function createRequestOptions(url) {
    const options = {
        origin: url.origin,
        path: url.pathname + url.search,
        method: "GET"
    };
    if (requestTimeout !== null) {
        options.headersTimeout = requestTimeout;
        options.bodyTimeout = requestTimeout;
    }
    return options;
}
/**
 * Wait for the request queue to not be full
 * @returns The queue ID for this request
 */
function enqueueRequest() {
    return __awaiter(this, void 0, void 0, function* () {
        while (queue.size >= getRequestQueueLimit()) {
            yield (0, promises_1.setTimeout)(1);
        }
        ;
        const id = (0, crypto_1.randomUUID)();
        queue.add(id);
        return id;
    });
}
/**
 * Perform a GET request
 */
function request(url) {
    return __awaiter(this, void 0, void 0, function* () {
        const id = yield enqueueRequest();
        try {
            const res = yield getAgent()
                .request(createRequestOptions(url));
            if (res.statusCode < 400) {
                return res;
            }
            else {
                throw new error_1.RequestError(res.statusCode);
            }
        }
        finally {
            queue.delete(id);
        }
    });
}
exports.request = request;
/**
 * Perform a GET request with authentication and parse as JSON
 */
function requestWithAuth(url) {
    return __awaiter(this, void 0, void 0, function* () {
        const parsedUrl = new URL(url);
        switch (true) {
            case !!(0, auth_1.getOauthToken)():
                parsedUrl.searchParams.set("oauth_token", (0, auth_1.getOauthToken)());
                break;
            case !!(0, auth_1.getClientID)():
                parsedUrl.searchParams.set("client_id", (0, auth_1.getClientID)());
                break;
            default:
                throw new error_1.ScdlError("Authentication not set");
        }
        parsedUrl.hash = "";
        const { body } = yield request(parsedUrl);
        return body.json();
    });
}
exports.requestWithAuth = requestWithAuth;
/**
 * Perform a GET request and output to an existing PassThrough
 *
 * Similar to `undici.stream`, but resolves on completion rather than
 * stream consumption
 * @param url The URL perform a request to
 * @param output The stream to write to
 * @param end Whether to end the writer on completion
 * @returns The output stream
 */
function streamThrough(url, output, end = true) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            function cleanup() {
                queue.delete(id);
                if (end) {
                    output.end();
                }
            }
            const id = yield enqueueRequest();
            getAgent()
                .dispatch(createRequestOptions(url), {
                onConnect: () => output.emit("connect"),
                onHeaders: statusCode => {
                    if (statusCode < 400) {
                        return true;
                    }
                    else {
                        cleanup();
                        reject(new error_1.RequestError(statusCode));
                        return false;
                    }
                },
                onData: chunk => {
                    output.write(chunk);
                    return true;
                },
                onComplete: () => {
                    cleanup();
                    resolve(output);
                },
                onError: err => {
                    cleanup();
                    reject(err);
                }
            });
        }));
    });
}
exports.streamThrough = streamThrough;
