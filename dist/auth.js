"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOauthToken = exports.getClientID = exports.setOauthToken = exports.setClientID = void 0;
let clientID = null;
let oauthToken = null;
/**
 * Set the client_id to access the API with
 */
function setClientID(id) {
    clientID = id;
}
exports.setClientID = setClientID;
/**
 * Set the oauth_token to access the API with
 *
 * This will be prioritized over a client_id
 */
function setOauthToken(token) {
    oauthToken = token;
}
exports.setOauthToken = setOauthToken;
/**
 * Get the currently set client_id
 */
function getClientID() {
    return clientID;
}
exports.getClientID = getClientID;
/**
 * Get the currently set oauth_token
 */
function getOauthToken() {
    return oauthToken;
}
exports.getOauthToken = getOauthToken;
