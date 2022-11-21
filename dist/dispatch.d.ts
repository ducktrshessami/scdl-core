/// <reference types="node" />
import { PassThrough, Readable } from "stream";
import { Dispatcher } from "undici";
import { ResponseData } from "undici/types/dispatcher";
/**
 * Set the agent to use for requests
 */
export declare function setAgent(agent: Dispatcher): void;
/**
 * Get the currently set agent
 */
export declare function getAgent(): Dispatcher;
/**
 * Set the timeout for requests in milliseconds
 */
export declare function setRequestTimeout(timeout: number): void;
/**
 * Get the timeout for requests in milliseconds
 */
export declare function getRequestTimeout(): number;
export declare function setRequestQueueLimit(limit: number): void;
export declare function getRequestQueueLimit(): number;
/**
 * Perform a GET request
 */
export declare function request(url: URL): Promise<ResponseData>;
/**
 * Perform a GET request with authentication and parse as JSON
 */
export declare function requestWithAuth(url: string | URL): Promise<any>;
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
export declare function streamThrough(url: URL, output: PassThrough, end?: boolean): Promise<Readable>;
