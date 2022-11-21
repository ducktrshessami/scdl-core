/**
 * A regular expression that matches SoundCloud track URLs
 *
 * Includes the `user`, `title`, and `secret` groups
 */
export declare const TrackURLPattern: RegExp;
/**
 * A regular expression that matches SoundCloud playlist URLs
 *
 * Includes the `user`, `title`, and `secret` groups
 */
export declare const PlaylistURLPattern: RegExp;
/**
 * Checks if a string matches the SoundCloud track URL format
 */
export declare function validateURL(url: string): boolean;
/**
 * Checks if a string matches the SoundCloud playlist URL format
 */
export declare function validatePlaylistURL(url: string): boolean;
