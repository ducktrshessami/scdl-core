import { randomUUID } from "crypto";
import { PassThrough, Readable } from "stream";
import { setTimeout } from "timers/promises";
import { Dispatcher, getGlobalDispatcher } from "undici";
import { getClientID, getOauthToken } from "./auth";
import { RequestError, ScdlError } from "./utils/error";

const DEFAULT_MAX = 20;
const DEFAULT_TIMEOUT = 30000;

const queue = new Set<string>();
let dispatcher: Dispatcher | null = null;
let requestTimeout: number | null = null;
let queueMax: number | null = null;

/**
 * Set the agent to use for requests
 * 
 * Defaults to the global dispatcher
 */
export function setAgent(agent: Dispatcher): void {
    dispatcher = agent;
}

/**
 * Get the currently set agent
 */
export function getAgent(): Dispatcher {
    return dispatcher ?? getGlobalDispatcher();
}

/**
 * Set the timeout for requests in milliseconds
 * 
 * Defaults to 30000 ms
 */
export function setRequestTimeout(timeout: number): void {
    requestTimeout = timeout;
}

/**
 * Get the timeout for requests in milliseconds
 */
export function getRequestTimeout(): number {
    return requestTimeout ?? DEFAULT_TIMEOUT;
}

/**
 * Set the limit for concurrent requests
 * 
 * Defaults to 20
 */
export function setRequestQueueLimit(limit: number): void {
    queueMax = limit;
}

/**
 * Get the limit for concurrent requests
 */
export function getRequestQueueLimit(): number {
    return queueMax ?? DEFAULT_MAX;
}

/**
 * Create GET request options from a URL
 */
function createRequestOptions(url: URL): Dispatcher.RequestOptions {
    const options: Dispatcher.RequestOptions = {
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
async function enqueueRequest(): Promise<string> {
    while (queue.size >= getRequestQueueLimit()) {
        await setTimeout(1);
    };
    const id = randomUUID();
    queue.add(id);
    return id;
}

/**
 * Perform a GET request
 */
export async function request(url: URL): Promise<Dispatcher.ResponseData> {
    const id = await enqueueRequest();
    try {
        const res = await getAgent()
            .request(createRequestOptions(url));
        if (res.statusCode < 400) {
            return res;
        }
        else {
            throw new RequestError(res.statusCode);
        }
    }
    finally {
        queue.delete(id);
    }
}

/**
 * Perform a GET request with authentication and parse as JSON
 */
export async function requestWithAuth(url: string | URL): Promise<any> {
    const parsedUrl = new URL(url);
    switch (true) {
        case !!getOauthToken():
            parsedUrl.searchParams.set("oauth_token", getOauthToken()!);
            break;
        case !!getClientID():
            parsedUrl.searchParams.set("client_id", getClientID()!);
            break;
        default:
            throw new ScdlError("Authentication not set");
    }
    parsedUrl.hash = "";
    const { body } = await request(parsedUrl);
    return body.json();
}

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
export async function streamThrough(
    url: URL,
    output: PassThrough,
    end: boolean = true
): Promise<Readable> {
    return new Promise(async (resolve, reject) => {
        function cleanup(): void {
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
                        reject(new RequestError(statusCode));
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
