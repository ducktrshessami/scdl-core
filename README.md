# scdl-core

A lightweight SoundCloud downloading module for Node.js

# Usage

```js
const fs = require("fs");
const scdl = require("scdl-core");

scdl.setClientID("YOUR_CLIENT_ID");

scdl.streamSync("https://soundcloud.com/ducktrshessami/unfinished")
    .pipe(fs.createWriteStream("song.mp3"));
```

See also: [soundcloud-key-fetch](https://www.npmjs.com/package/soundcloud-key-fetch) for client_id scraping
