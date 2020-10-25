# scdl

A lightweight SoundCloud downloading module.

Should this be called scdl-core for symmetry's sake?

![GitHub top language](https://img.shields.io/github/languages/top/ducktrshessami/scdl)

# Usage

```js
const fs = require("fs");
const scdl = require("scdl");

scdl.setClientID("YOUR_CLIENT_ID");

scdl("https://soundcloud.com/ducktrshessami/unfinished")
    .pipe(fs.createWriteStream("song.mp3"));
```

# API

## scdl(url)

Attempts to download a song from a url.

Returns a [readable stream](https://nodejs.org/api/stream.html#stream_class_stream_readable).

## scdl.setClientID(id)

Set your client_id for authentication.

***You must set either your client_id or your OAuth token before using this module's other features***

<details>
<summary>How to get your client_id</summary>

You do ***not*** need a SoundCloud account to obtain a client_id.

1. Go to SoundCloud in your web browser

2. Open the developer tools (pressing F12 usually works)

3. Open the Network tab of the developer tools

4. Refresh the page to populate the Network tab

5. Type `client_id` in the filter box

6. Grab your client_id from the request URL of any items that show up

Example: `https://api-v2.soundcloud.com/me/play-history/tracks?client_id=YOUR_CLIENT_ID`

</details>

## scdl.setOauthToken(token)

Set your OAuth token for authentication.

***You must set either your client_id or your OAuth token before using this module's other features***

<details>
<summary>How to get your OAuth token</summary>

You ***do*** need a SoundCloud account to obtain an OAuth token.

***Unfortunately, it is no longer possible to obtain your OAuth token without [an app](https://developers.soundcloud.com/), and SoundCloud [has not been taking API application requests in a while](https://soundcloud.com/you/apps/new).***

I'm leaving this method here in case it happens to work randomly.

1. Go to SoundCloud in your web browser

2. If you are logged in to your account, log out.

3. Open the developer tools (pressing F12 usually works)

4. Open the Network tab of the developer tools

5. Check the `Preserve log` box (`Persist Logs` in cog wheel on Firefox)

6. Log in to your account

7. Grab the `access_token` from the first few items that show up

8. If your access_token does not show up, try again from Step 2. It can take a couple tries

Example: `access_token: X-XXXXXX-XXXXXXXX-XXXXXXXXXXXXXXX`

</details>

## scdl.getInfo(url)

## scdl.downloadFromInfo(info)

## scdl.validateURL(url)

## scdl.getPermalinkURL(URL)
