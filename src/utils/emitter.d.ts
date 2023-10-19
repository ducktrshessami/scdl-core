export interface Emitter<EventMap extends Record<string, any[]>> {
    emit<Event extends keyof EventMap>(event: Event, ...args: EventMap[Event]): boolean;
    addListener<Event extends keyof EventMap>(event: Event, listener: (...args: EventMap[Event]) => void): this;
    on<Event extends keyof EventMap>(event: Event, listener: (...args: EventMap[Event]) => void): this;
    once<Event extends keyof EventMap>(event: Event, listener: (...args: EventMap[Event]) => void): this;
    prependListener<Event extends keyof EventMap>(event: Event, listener: (...args: EventMap[Event]) => void): this;
    prependOnceListener<Event extends keyof EventMap>(event: Event, listener: (...args: EventMap[Event]) => void): this;
    removeListener<Event extends keyof EventMap>(event: Event, listener: (...args: EventMap[Event]) => void): this;
}
