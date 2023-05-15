require('dotenv').config()
const Twitch = require('tmi.js')
const LastFm = require('lastfm').LastFmNode
const Spotify = require('spotify-web-api-node')
const axios = require('axios')
const { setupCache } = require('axios-cache-interceptor')


const {
  TWITCH_BOT_USERNAME,
  TWITCH_OAUTH_TOKEN,
  TWITCH_CHANNEL,
  LASTFM_CLIENT_ID,
  LASTFM_CLIENT_SECRET,
  LASTFM_USERNAME,
  SPOTIFY_CLIENT_ID,
  SPOTIFY_CLIENT_SECRET
} = process.env

const twitch = new Twitch.Client({
  options: { debug: true },
  identity: {
    username: TWITCH_BOT_USERNAME,
    password: TWITCH_OAUTH_TOKEN
  },
  channels: [TWITCH_CHANNEL]
})

const lastFm = new LastFm({
  api_key: LASTFM_CLIENT_ID,
  secret: LASTFM_CLIENT_SECRET
})

const spotify = new Spotify({
  clientId: SPOTIFY_CLIENT_ID,
  clientSecret: SPOTIFY_CLIENT_SECRET
})

const lastFmStream = lastFm.stream(LASTFM_USERNAME)

const cachedAxios = setupCache(axios)

let autoSend = false
let lastSong

const debug = (message, level) => {
  const now = new Date()
  const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  const color = level === 'error' ? '\x1b[33m' : ''
  console.log(`[${time}] ${color}${level || 'info'}: ${message}\x1b[0m`)
}

const sendMessage = message =>
  twitch.say(TWITCH_CHANNEL, message)

const getUniversalLink = async url => {
  const response = await cachedAxios.post('https://songwhip.com', { url })
  return response.data.url
}

const sendTrack = type => {
  if (!lastSong) {
    sendMessage('Something went wrong. Maybe try the next song...')
    return
  }
  sendMessage(`🎶 Now Playing ${lastSong.display[type]} // Stream it: ${lastSong.universalLinks[type]}`)
}

const sanitizeTrack = track => {
  return track.replace('Explicit', '').trim()
}

const getSpotifyToken = () =>
  axios.post('https://accounts.spotify.com/api/token', {
    grant_type: 'client_credentials'
  }, {
    headers: {
      // eslint-disable-next-line quote-props
      'Authorization': `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  }).then(response => {
    spotify.setAccessToken(response.data.access_token)
    debug('Succesfully authenticated Spotify')
  })

const searchForTrack = search =>
  spotify.searchTracks(search).then(async searchResponse => {
    const results = searchResponse.body.tracks.items
    const { display, track } = lastSong

    if (results.length === 0) {
      debug(`Spotify returned no results for \x1b[33m'${search}'`, 'error')
      return
    }

    const item = results[0]
    const spotifyLinks = {
      track: item.external_urls.spotify,
      album: item.album.external_urls.spotify,
      artist: item.artists[0].external_urls.spotify
    }
    const universalLinks = {
      track: await getUniversalLink(spotifyLinks.track),
      album: await getUniversalLink(spotifyLinks.album),
      artist: await getUniversalLink(spotifyLinks.artist)
    }
    lastSong = { display, track, spotifyLinks, universalLinks }
    debug('Song links converted and saved')
    if (autoSend) {
      sendTrack('track')
    }
  })

getSpotifyToken().then(() => {
  debug('Connecting to LastFM and Twitch...')
  lastFmStream.start()
  twitch.connect()
})

lastFmStream.on('nowPlaying', async track => {
  const search = `artist:${track.artist['#text']} track:${sanitizeTrack(track.name)}`
  const display = {
    track: `${sanitizeTrack(track.name)} by ${track.artist['#text']}`,
    album: `${track.album['#text']} by ${track.artist['#text']}`,
    artist: track.artist['#text']
  }
  debug(`Scrobble received: \x1b[36m${display.track}`)
  lastSong = { display, track }
  searchForTrack(search).catch(error => {
    lastSong = undefined

    if (error.body && error.body.error.status === 401) {
      debug('Got 401 from Spotify, re-authenticating')
      getSpotifyToken().then(() => {
        searchForTrack(search).catch(error2 => {
          console.error('Couldn\'t re-authenticate with Spotify', error2)
        })
      })
    } else {
      console.error(error)
    }
    debug('Spotify search encountered an error', 'error')
    console.error(error)
  })
})

twitch.on('message', (_, user, message) => {
  switch (message.toLowerCase()) {
    case '!songlink enable':
      if (user.username === TWITCH_CHANNEL.toLowerCase()) {
        autoSend = true
        sendMessage('Enabled Now Playing auto send')
      }
      break
    case '!songlink disable':
      if (user.username === TWITCH_CHANNEL.toLowerCase()) {
        autoSend = false
        sendMessage('Disabled Now Playing auto send')
      }
      break
    case '!song':
    case '!track':
    case '!music':
    case '!nowplaying':
      sendTrack('track')
      break
    case '!artist':
      sendTrack('artist')
      break
    case '!album':
      sendTrack('album')
      break
  }
})
