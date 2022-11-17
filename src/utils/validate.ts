/**
 * Checks if a string matches the SoundCloud track URL format
 */
export function validateURL(url: string): boolean {
    return /(?:^https?:\/\/)?(?:www.)?soundcloud\.com\/[\w-]+\/[\w-]+\/?(?:(?:\/?$)|(?:[?#]))/i.test(url);
}
