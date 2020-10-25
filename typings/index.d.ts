declare module "scdl" {
    import {Readable} from "stream";

    function scdl(URL: string): Readable;
    export = scdl;

    export function setClientId(ID: string): void;
    export function setOauthToken(token: string): void;
    export function getInfo(URL: string): Promise<object>;
    export function downloadFromInfo(info: object): Readable;
    export function validateURL(URL: string): Boolean;
    export function getPermalinkURL(URL: string): string;
}
