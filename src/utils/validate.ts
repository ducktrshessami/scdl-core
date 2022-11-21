/**
 * A regular expression that matches SoundCloud track URLs
 * 
 * Includes the `user`, `title`, and `secret` groups
 */
export const TrackURLPattern = /^(?:https?:\/\/)?(?:www\.)?soundcloud\.com\/(?<user>[\w-]+)\/(?<title>[\w-]+)\/?(?<secret>(?<=\/)[\w-]+)?(?:(?<!\/)\/?)(?=[?#]|$)/i;

/**
 * A regular expression that matches SoundCloud playlist URLs
 * 
 * Includes the `user`, `title`, and `secret` groups
 */
export const PlaylistURLPattern = /^(?:https?:\/\/)?(?:www\.)?soundcloud\.com\/(?<user>[\w-]+)\/sets\/(?<title>[\w-]+)\/?(?<secret>(?<=\/)[\w-]+)?(?:(?<!\/)\/?)(?=[?#]|$)/i;

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
    return PlaylistURLPattern.test(url);
}
