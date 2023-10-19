import { PassThrough, Readable } from "stream";
import { Dispatcher, getGlobalDispatcher } from "undici";
import { getClientID, getOauthToken } from "./auth";
import { RequestError, ScdlError } from "./utils/error";
import { Queue } from "./queue";
import { Emitter } from "./utils/emitter";

const DEFAULT_TIMEOUT = 30000;
const queue = new Queue();
let dispatcher: Dispatcher | null = null;
let requestTimeout: number | null = null;

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
 * Create GET request options from a URL
 */
function createRequestOptions(url: URL): Dispatcher.RequestOptions {
    const options: Dispatcher.RequestOptions = {
        origin: url.origin,
        path: url.pathname + url.search,
        method: "GET"
    };
    const timeout = getRequestTimeout();
    options.headersTimeout = timeout;
    options.bodyTimeout = timeout;
    return options;
}

/**
 * Perform a GET request
 */
export async function request(url: URL): Promise<Dispatcher.ResponseData> {
    await queue.enqueue();
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
        queue.dequeue();
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
    output: StreamThrough,
    end: boolean = true
): Promise<Readable> {
    return new Promise(async (resolve, reject) => {
        function cleanup(): void {
            queue.dequeue();
            if (end) {
                output.end();
            }
        }

        await queue.enqueue();
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

export type StreamThrough = Emitter<{ connect: [] }> & PassThrough;
