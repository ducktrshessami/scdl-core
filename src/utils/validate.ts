/**
 * Checks if a string matches the SoundCloud track URL format
 */
export function validateURL(url: string): boolean {
    return /(?:^https?:\/\/)?(?:www.)?soundcloud\.com\/[\w-]+\/[\w-]+\/?(?:(?:\/?$)|(?:[?#]))/i.test(url);
}

/**
 * Checks if a string matches the SoundCloud playlist URL format
 */
export function validatePlaylistURL(url: string): boolean {
    return /(?:^https?:\/\/)?(?:www.)?soundcloud\.com\/[\w-]+\/sets\/[\w-]+(?:\/[\w-]+)?\/?(?:(?:\/?$)|(?:[?#]))/i.test(url);
}
