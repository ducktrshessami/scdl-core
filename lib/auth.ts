export let clientID: string | null = null;
export let oauthToken: string | null = null;

export function setClientID(client_id: string | null): void {
    clientID = client_id;
}

export function setOauthToken(token: string | null): void {
    oauthToken = token;
}
