"use strict";
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
    return dispatcher ?? (0, undici_1.getGlobalDispatcher)();
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
    return requestTimeout ?? DEFAULT_TIMEOUT;
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
    return queueMax ?? DEFAULT_MAX;
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
async function enqueueRequest() {
    while (queue.size >= getRequestQueueLimit()) {
        await (0, promises_1.setTimeout)(1);
    }
    ;
    const id = (0, crypto_1.randomUUID)();
    queue.add(id);
    return id;
}
/**
 * Perform a GET request
 */
async function request(url) {
    const id = await enqueueRequest();
    try {
        const res = await getAgent()
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
}
exports.request = request;
/**
 * Perform a GET request with authentication and parse as JSON
 */
async function requestWithAuth(url) {
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
    const { body } = await request(parsedUrl);
    return body.json();
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
async function streamThrough(url, output, end = true) {
    return new Promise(async (resolve, reject) => {
        function cleanup() {
            queue.delete(id);
            if (end) {
                output.end();
            }
        }
        const id = await enqueueRequest();
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
    });
}
exports.streamThrough = streamThrough;
