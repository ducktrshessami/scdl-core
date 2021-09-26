declare module "scdl-core" {
    import { Readable } from "stream";

    const scdl: {
        (url: String, options?: Object): Readable;

        clientID?: String;
        oauthToken?: String;

        setClientID(ID: String): void;
        setOauthToken(token: String): void;
        getInfo(url: String): Promise<Object>;
        downloadFromInfo(info: Object, options?: Object): Readable;
        validateURL(url: String): Boolean;
        getPermalinkURL(url: String): String;
        playlist: {
            (url: String, options?: Object): Promise<Array<Readable>>;

            downloadFromInfo(url: String, options?: Object): Promise<Array<Readable>>;
            validateURL(url: String): Boolean;
            getPermalinkURL(url: String): String;
            getInfo(url: String): Promise<Object>;
        }
    }

    export = scdl;
}
