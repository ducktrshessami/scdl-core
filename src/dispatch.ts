import { Dispatcher, getGlobalDispatcher } from "undici";

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
