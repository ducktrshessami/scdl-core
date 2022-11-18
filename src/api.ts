import { requestWithAuth } from "./dispatch";

const RESOLVE_ENDPOINT = "https://api-v2.soundcloud.com/resolve";

/**
 * Resolve info from a URL
 */
export async function rawResolve(url: string): Promise<any> {
    const endpoint = new URL(RESOLVE_ENDPOINT);
    endpoint.searchParams.set("url", url);
    return requestWithAuth(endpoint);
}
