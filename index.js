require('dotenv').config()
const Twitch = require('tmi.js')
const Odesli = require('odesli.js')
const LastFm = require('lastfm').LastFmNode
const Spotify = require('spotify-web-api-node')
const axios = require('axios')

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
  channels: [ TWITCH_CHANNEL ]
})

const odesli = new Odesli({
  version: 'v1-alpha.1'
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

let autoSend = false
let lastSong

const sendMessage = message =>
  twitch.say(TWITCH_CHANNEL, message)

const sendTrackSong = () => 
  sendMessage(`🎶 Now Playing ${lastSong.trackDisplay} // Stream this track: ${lastSong.universalUrl}`)

const sanitizeTrack = track => {
  return track.replace('Explicit', '').trim()
}

axios.post('https://accounts.spotify.com/api/token', {
    grant_type: 'client_credentials'
  }, {
  headers: {
    'Authorization': `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')}`,
    'Content-Type': 'application/x-www-form-urlencoded'
  },
}).then(response => {
  spotify.setAccessToken(response.data.access_token)
  console.log('Succesfully authenticated Spotify. Connecting to LastFM and Twitch...')
  lastFmStream.start()
  twitch.connect()
})

lastFmStream.on('nowPlaying', track => {
  const search = `artist:${track.artist['#text']} track:${sanitizeTrack(track.name)}`
  const trackDisplay = `${sanitizeTrack(track.name)} by ${track.artist['#text']}`
  console.log({search})
  spotify.searchTracks(search).then(searchResponse => {
    if (searchResponse.body.tracks.items.length === 0) {
      twitch.say(TWITCH_CHANNEL, `⚠️ Couldn't find ${trackDisplay}`)
      return;
    }

    const url = searchResponse.body.tracks.items[0].external_urls.spotify
    odesli.fetch(url).then(convertResponse => {
      const universalUrl = convertResponse.pageUrl
      lastSong = { trackDisplay, universalUrl }
      if (autoSend) {
        sendTrackSong()
      }
    })
  }).catch(error => {
    lastSong = undefined
    console.error(error)
    twitch.say(TWITCH_CHANNEL, `⚠️ Error searching for track`)
  })
})

twitch.on('message', (_, user, message) => {
  switch (message.toLowerCase()) {
    case '!songlink enable':
      if (user.username === TWITCH_CHANNEL.toLowerCase()) {
        autoSend = true
        sendMessage('Enabled Now Playing auto send')
      }
      break;
    case '!songlink disable':
      if (user.username === TWITCH_CHANNEL.toLowerCase()) {
        autoSend = false
        sendMessage('Disabled Now Playing auto send')
      }
      break;
    case '!song':
    case '!track':
    case '!music':
    case '!nowplaying':
      sendTrackSong()
      break;
  }
})
