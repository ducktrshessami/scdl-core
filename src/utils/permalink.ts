import { TrackURLPattern } from "./validate";

/**
 * Formats a URL as a track's permalink URL
 */
export function getPermalinkURL(url: string): string {
    const result = url.match(TrackURLPattern);
    if (result) {
        const publicURL = `https://soundcloud.com/${result.groups!.user}/${result.groups!.title}`;
        return result.groups!.secret ? publicURL + `/${result.groups!.secret}` : publicURL;
    }
    else {
        return "";
    }
}
