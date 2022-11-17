export let clientID: string | null = null;
export let oauthToken: string | null = null;

/**
 * Set the client_id to access the API with
 */
export function setClientID(id: string | null): void {
    clientID = id;
}

/**
 * Set the oauth_token to access the API with
 * 
 * This will be prioritized over a client_id
 */
export function setOauthToken(token: string | null): void {
    oauthToken = token;
}
