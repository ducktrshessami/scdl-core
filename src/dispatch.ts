import { Dispatcher, getGlobalDispatcher } from "undici";
import { ResponseData } from "undici/types/dispatcher";
import { RequestError } from "./error";

let dispatcher = getGlobalDispatcher();

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
 * Create GET request options from a URL
 */
function createRequestOptions(url: string): Dispatcher.RequestOptions {
    const parsedUrl = new URL(url);
    return {
        origin: parsedUrl.origin,
        path: parsedUrl.pathname + parsedUrl.search,
        method: "GET"
    };
}

/**
 * Perform a GET request
 */
export async function request(url: string): Promise<ResponseData> {
    const res = await dispatcher.request(createRequestOptions(url));
    if (res.statusCode < 400) {
        return res;
    }
    else {
        throw new RequestError(res.statusCode);
    }
}
