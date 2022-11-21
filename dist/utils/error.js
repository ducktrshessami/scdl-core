"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestError = exports.ScdlError = void 0;
const http_1 = require("http");
class CustomError extends Error {
    constructor(message) {
        super(message);
        this.name = this.constructor.name;
    }
}
class ScdlError extends CustomError {
}
exports.ScdlError = ScdlError;
class RequestError extends CustomError {
    constructor(statusCode) {
        super(`${statusCode} ${http_1.STATUS_CODES[statusCode]}`);
    }
}
exports.RequestError = RequestError;
