# scdl-core

A lightweight SoundCloud streaming module

# Usage

```js
const fs = require("fs");
const scdl = require("scdl-core");

scdl.setClientID("YOUR_CLIENT_ID");

scdl.streamSync("https://soundcloud.com/ducktrshessami/unfinished")
    .pipe(fs.createWriteStream("song.mp3"));
```

See also: [@scdl/fetch-client](https://github.com/ducktrshessami/scdl-fetch-client) for client_id scraping

### Stream Options
`stream`, `streamSync`, `streamFromInfo`, `streamFromInfoSync`, `streamPlaylist`, `streamPlaylistFromInfo`, and `streamPlaylistFromInfoSync` all accept an optional options object for determining the transcoding to stream

The below is equivalent to the default options

```js
const {
    stream,
    Preset,
    Protocol,
    MimeType,
    Quality
} = require("scdl-core");

stream("https://soundcloud.com/ducktrshessami/unfinished", {
    strict: false,
    preset: Preset.MP3,
    protocol: Protocol.PROGRESSIVE,
    mimeType: MimeType.MPEG,
    quality: Quality.SQ
});
```
