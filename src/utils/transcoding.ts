export enum Preset {
    MP3 = "mp3_0_1",
    OPUS = "opus_0_0"
}

export enum Protocol {
    PROGRESSIVE = "progressive",
    HLS = "hls"
}

export enum MimeType {
    MPEG = "audio/mpeg",
    OPUS = "audio/ogg; codecs=\"opus\""
}

export enum Quality {
    SQ = "sq",
    /**
     * I've only seen `sq`, but I'm assuming something like this exists
     * for SoundCloud Go+ subscribers
     */
    HQ = "hq"
}

export type Transcoding = {
    url: string
    preset: Preset
    duration: number
    snipped: boolean
    format: {
        protocol: Protocol
        mime_type: MimeType
    }
    quality: Quality
};
