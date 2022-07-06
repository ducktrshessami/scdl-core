import { Readable } from "stream";

declare module "scdl-core" {
    type StreamOptions = {
        strict?: boolean,
        preset?: string,
        protocol?: string,
        mimeType?: string,
        quality?: string
    };

    const scdl: {
        (url: string, options?: StreamOptions): Readable;

        clientID?: string;
        oauthToken?: string;

        setClientID(id: string): void;
        setOauthToken(token: string): void;
        awaitDownload(url: string, options?: StreamOptions): Promise<Readable>;
        getInfo(url: string): Promise<object>;
        downloadFromInfo(info: object, options?: StreamOptions): Readable;
        awaitDownloadFromInfo(info: object, options?: StreamOptions): Promise<Readable>;
        validateURL(url: string): boolean;
        getPermalinkURL(url: string): string;
        playlist: {
            (url: string, options?: StreamOptions): Promise<Array<Readable> | null>;

            downloadFromInfo(info: object, options?: StreamOptions): Promise<Array<Readable> | null>;
            validateURL(url: string): boolean;
            getPermalinkURL(url: string): string;
            getInfo(url: string): Promise<object>;
        }
    }

    export = scdl;
}
