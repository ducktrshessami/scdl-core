"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rawResolve = void 0;
const dispatch_1 = require("./dispatch");
const RESOLVE_ENDPOINT = "https://api-v2.soundcloud.com/resolve";
/**
 * Resolve info from a URL
 */
function rawResolve(url) {
    return __awaiter(this, void 0, void 0, function* () {
        const endpoint = new URL(RESOLVE_ENDPOINT);
        endpoint.searchParams.set("url", url);
        return (0, dispatch_1.requestWithAuth)(endpoint);
    });
}
exports.rawResolve = rawResolve;
