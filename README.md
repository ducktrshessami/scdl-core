# scdl-core

A lightweight SoundCloud downloading module for Node.js

# Installation

After installing [Node.js](https://nodejs.org/), run the following command in your package directory:

```
npm install github:ducktrshessami/scdl-core
```

When I become more social I'll consider putting this on [npm](https://www.npmjs.com/).

# Usage

```js
const fs = require("fs");
const scdl = require("scdl-core");

scdl.setClientID("YOUR_CLIENT_ID");

scdl.streamSync("https://soundcloud.com/ducktrshessami/unfinished")
    .pipe(fs.createWriteStream("song.mp3"));
```

See also: [soundcloud-key-fetch](https://www.npmjs.com/package/soundcloud-key-fetch) for client_id scraping
