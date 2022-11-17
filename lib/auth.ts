export let client_id: string | null = null;
export let oauth_token: string | null = null;

export function setClientID(clientID: string | null): void {
    client_id = clientID;
}

export function setOauthToken(token: string | null): void {
    oauth_token = token;
}
