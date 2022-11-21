/**
 * Set the client_id to access the API with
 */
export declare function setClientID(id: string | null): void;
/**
 * Set the oauth_token to access the API with
 *
 * This will be prioritized over a client_id
 */
export declare function setOauthToken(token: string | null): void;
/**
 * Get the currently set client_id
 */
export declare function getClientID(): string | null;
/**
 * Get the currently set oauth_token
 */
export declare function getOauthToken(): string | null;
