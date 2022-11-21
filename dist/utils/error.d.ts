declare class CustomError extends Error {
    constructor(message?: string);
}
export declare class ScdlError extends CustomError {
}
export declare class RequestError extends CustomError {
    constructor(statusCode: number);
}
export {};
