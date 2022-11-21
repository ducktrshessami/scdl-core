import { STATUS_CODES } from "http";

class CustomError extends Error {
    constructor(message?: string) {
        super(message);
        this.name = this.constructor.name;
    }
}

export class ScdlError extends CustomError { }

export class RequestError extends CustomError {
    constructor(statusCode: number) {
        super(`${statusCode} ${STATUS_CODES[statusCode]}`);
    }
}
