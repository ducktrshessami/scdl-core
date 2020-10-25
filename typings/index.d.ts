declare module "scdl" {
    import {Readable} from "stream";

    function scdl(URL: string): Readable;

    namespace scdl {
        function setClientId(ID: string): void;
        function setOauthToken(token: string): void;
        function getInfo(URL: string): Promise<object>;
        function downloadFromInfo(info: object): Readable;
        function validateURL(URL: string): Boolean;
        function getPermalinkURL(URL: string): string;
    }

    export = scdl;
}
