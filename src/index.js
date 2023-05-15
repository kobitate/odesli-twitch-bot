const debug = require('./util/debug')

const axios = require('axios')
const { setupCache } = require('axios-cache-interceptor')

const Twitch = require('./clients/twitch')
const twitch = new Twitch()

const LastFm = require('./clients/lastfm')
const lastFm = new LastFm()

const Spotify = require('./clients/spotify')
const spotify = new Spotify()

const cachedAxios = setupCache(axios)

let autoSend = false
let lastSong

const getUniversalLink = async url => {
  // this cache doesn't persist across script restarts, need to expand upon this...
  const response = await cachedAxios.post('https://songwhip.com', { url })
  return response.data.url
}

const sendTrack = async (type) => {
  if (!lastSong) {
    twitch.sendMessage('Something went wrong. Maybe try the next song...')
    return
  }

  if (['album', 'artist'].includes(type)) {
    lastSong.universalLinks[type] = await getUniversalLink(lastSong.spotifyLinks[type])
  }

  twitch.sendMessage(`🎶 Now Playing ${lastSong.display[type]} // Stream it: ${lastSong.universalLinks[type]}`)
}

const sanitizeTrack = track => {
  return track.replace('Explicit', '').trim()
}

const searchForTrack = query =>
  spotify.search(query).then(async searchResponse => {
    const results = searchResponse.body.tracks.items
    const { display, track } = lastSong

    if (results.length === 0) {
      debug(`Spotify returned no results for \x1b[33m'${query}'`, 'error')
      return
    }

    const item = results[0]
    const spotifyLinks = {
      track: item.external_urls.spotify,
      album: item.album.external_urls.spotify,
      artist: item.artists[0].external_urls.spotify
    }
    const universalLinks = {
      track: await getUniversalLink(spotifyLinks.track)
      // no longer getting these ahead of time to limit API calls
      // album: await getUniversalLink(spotifyLinks.album),
      // artist: await getUniversalLink(spotifyLinks.artist)
    }
    lastSong = { display, track, spotifyLinks, universalLinks }
    debug('Song links converted and saved')
    if (autoSend) {
      sendTrack('track')
    }
  })

spotify.getToken().then(() => {
  debug('Connecting to LastFM and Twitch...')
  lastFm.connect()
  twitch.connect()
})

lastFm.onScrobble(async track => {
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
      spotify.getToken().then(() => {
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

twitch.onMessage((user, message) => {
  switch (message) {
    case '!songlink enable':
    case '!songwhip enable':
      if (user.broadcaster || user.mod) {
        autoSend = true
        twitch.sendMessage('Enabled Now Playing auto send')
      }
      break
    case '!songlink disable':
    case '!songwhip disable':
      if (user.broadcaster || user.mod) {
        autoSend = false
        twitch.sendMessage('Disabled Now Playing auto send')
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
