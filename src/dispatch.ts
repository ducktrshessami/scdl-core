import { Dispatcher, getGlobalDispatcher } from "undici";
import { ResponseData } from "undici/types/dispatcher";
import { getClientID, getOauthToken } from "./auth";
import { RequestError, ScdlError } from "./error";

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
function createRequestOptions(url: URL): Dispatcher.RequestOptions {
    return {
        origin: url.origin,
        path: url.pathname + url.search,
        method: "GET"
    };
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
export async function requestWithAuth(url: string): Promise<any> {
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
