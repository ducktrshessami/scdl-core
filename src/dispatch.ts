import { PassThrough, Readable } from "stream";
import { Dispatcher, getGlobalDispatcher } from "undici";
import { ResponseData } from "undici/types/dispatcher";
import { getClientID, getOauthToken } from "./auth";
import { RequestError, ScdlError } from "./utils/error";

const DEFAULT_TIMEOUT = 30000;

let dispatcher = getGlobalDispatcher();
let requestTimeout: number | null = null;

/**
 * Set the agent to use for requests
 */
export function setAgent(agent: Dispatcher): void {
    dispatcher = agent;
}

/**
 * Get the currently set agent
 */
export function getAgent(): Dispatcher {
    return dispatcher;
}

/**
 * Set the timeout for requests in milliseconds
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
    if (requestTimeout !== null) {
        options.headersTimeout = requestTimeout;
        options.bodyTimeout = requestTimeout;
    }
    return options;
}

/**
 * Perform a GET request
 */
export async function request(url: URL): Promise<ResponseData> {
    const res = await dispatcher.request(createRequestOptions(url));
    if (res.statusCode < 400) {
        return res;
    }
    else {
        throw new RequestError(res.statusCode);
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
    return new Promise((resolve, reject) =>
        dispatcher.dispatch(createRequestOptions(url), {
            onConnect: () => output.emit("connect"),
            onHeaders: statusCode => {
                if (statusCode < 400) {
                    return true;
                }
                else {
                    reject(new RequestError(statusCode));
                    return false;
                }
            },
            onData: chunk => {
                output.write(chunk);
                return true;
            },
            onComplete: () => {
                if (end) {
                    output.end();
                }
                resolve(output)
            },
            onError: reject
        })
    );
}
