declare module "scdl-core" {
    import { Readable } from "stream";

    function scdl(url: String, options?: Object): Readable;

    namespace scdl {
        function setClientID(ID: String): void;
        function setOauthToken(token: String): void;
        function getInfo(url: String): Promise<Object>;
        function downloadFromInfo(info: Object, options?: Object): Readable;
        function validateURL(url: String): Boolean;
        function getPermalinkURL(url: String): String;
        function playlist(url: String, options?: Object): Promise<Array<Readable>>;
    }

    namespace scdl.playlist {
        function downloadFromInfo(url: String, options?: Object): Promise<Array<Readable>>;
        function validateURL(url: String): Boolean;
        function getPermalinkURL(url: String): String;
        function getInfo(url: String): Promise<Object>;
    }

    export = scdl;
}
