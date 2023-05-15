# Universal Music Link Twitch Bot

![](https://i.imgur.com/9KUATwo.png)

Sure, you're not exactly supposed to play copyrighted music on Twitch. But,
for those who are ignoring that rule, link your Twitch viewers to a page with 
links to just about every streaming platform for the currently playing song.

## Environment Variables
| Variable                | Example        | Description                                                                                                                           |
| ----------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `TWITCH_BOT_USERNAME`   | `songlink`     | Bot username used to interact with Twitch chat                                                                                        |
| `TWITCH_OAUTH_TOKEN`    | `oauth:abc123` | OAuth token associated with bot account. See [tmi.js docs](https://twitchapps.com/tmi/)                                               |
| `TWITCH_CHANNEL`        | `KaiTiggy`     | Channel bot will join when connecting to Twitch                                                                                       |
| `LASTFM_CLIENT_ID`      | `abc123`       | LastFM Client ID, See [LastFM Docs](https://www.last.fm/api/authentication)                                                           |
| `LASTFM_CLIENT_SECRET`  | `abc123`       | LastFM Client Secret                                                                                                                  |
| `LASTFM_USERNAME`       | `KaiTiggy`     | LastFM username where tracks are scrobbled. Relies on your music client using the Now Scrobbling feature                              |
| `SPOTIFY_CLIENT_ID`     | `abc123`       | Spotify Client ID for Client Authorization flow, See [Spotify docs](https://developer.spotify.com/documentation/web-api/quick-start/) |
| `SPOTIFY_CLIENT_SECRET` | `abc123`       | Spotify Client Secret                                                                                                                 |

## Commands

| Command                                                | Details                                                                                         |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------------------- |
| `!songlink [enable\|disable]`                          | Enable or disable automatic sending of the current LastFM song. Only available to channel owner |
| `!song`<br />`!nowplaying`<br />`!track`<br />`!music` | Send the link for the currently playing song                                                    |
| `!album`                                               | Send the link for the current song's album                                                      |                                        
| `!artist`                                              | Send the link for the current song's artist                                                     |


> An unofficial product powered by [Songwhip](https://songwhip.com)
