import { Readable } from "stream";

declare module "scdl-core" {
    type StreamOptions = {
        strict?: Boolean,
        preset?: String,
        protocol?: String,
        mimeType?: String,
        quality?: String
    };

    const scdl: {
        (url: String, options?: StreamOptions): Readable;

        clientID?: String;
        oauthToken?: String;

        setClientID(id: String): void;
        setOauthToken(token: String): void;
        awaitDownload(url: String, options?: StreamOptions): Promise<Readable>;
        getInfo(url: String): Promise<Object>;
        downloadFromInfo(info: Object, options?: StreamOptions): Readable;
        awaitDownloadFromInfo(info: Object, options?: StreamOptions): Promise<Readable>;
        validateURL(url: String): Boolean;
        getPermalinkURL(url: String): String;
        playlist: {
            (url: String, options?: StreamOptions): Promise<Array<Readable>>;

            downloadFromInfo(info: Object, options?: StreamOptions): Promise<Array<Readable>>;
            validateURL(url: String): Boolean;
            getPermalinkURL(url: String): String;
            getInfo(url: String): Promise<Object>;
        }
    }

    export = scdl;
}
