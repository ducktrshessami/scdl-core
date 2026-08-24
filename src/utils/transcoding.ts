/**
 * DISCLAIMER: This should not be considered comprehensive.
 * These are simply common values.
 */
export enum Protocol {
    PROGRESSIVE = "progressive",
    HLS = "hls"
}

/**
 * I've only seen `sq` and `lq`, but I'm assuming there's a higher quality
 * for SoundCloud Go+ subscribers
 */
export enum Quality {
    SQ = "sq",
    LQ = "lq"
}

export type Preset = `${string}_${string}`;

export type MimeType = `audio/${string}`;

export interface Transcoding {
    url: string;
    preset: Preset;
    duration: number;
    snipped: boolean;
    format: {
        protocol: string;
        mime_type: MimeType;
    };
    quality: string;
    is_legacy_transcoding: boolean;
}
