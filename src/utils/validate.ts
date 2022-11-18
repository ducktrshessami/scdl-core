/**
 * A regular expression that matches SoundCloud track URLs
 * 
 * Includes the `user` and `title` groups
 */
export const TrackURLPattern = /^(?:https?:\/\/)?(?:www.)?soundcloud\.com\/(?<user>[\w-]+)\/(?<title>[\w-]+)\/?(?=[?#]|$)/i;

/**
 * Checks if a string matches the SoundCloud track URL format
 */
export function validateURL(url: string): boolean {
    return TrackURLPattern.test(url);
}

/**
 * Checks if a string matches the SoundCloud playlist URL format
 */
export function validatePlaylistURL(url: string): boolean {
    return /(?:^https?:\/\/)?(?:www.)?soundcloud\.com\/[\w-]+\/sets\/[\w-]+(?:\/[\w-]+)?\/?(?:(?:\/?$)|(?:[?#]))/i.test(url);
}
