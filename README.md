# scdl

A lightweight SoundCloud downloading module.

Should this be called scdl-core for symmetry's sake?

## Usage

```js
const fs = require("fs");
const scdl = require("scdl");

scdl.setClientID("YOUR_CLIENT_ID");

scdl("https://soundcloud.com/ducktrshessami/unfinished")
    .pipe(fs.createWriteStream("song.mp3"));
```
