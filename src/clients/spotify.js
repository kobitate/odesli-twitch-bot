require('dotenv').config()
const SpotifyApi = require('spotify-web-api-node')
const axios = require('axios')

const {
  SPOTIFY_CLIENT_ID,
  SPOTIFY_CLIENT_SECRET
} = process.env

class Spotify {
  constructor() {
    this.client = new SpotifyApi({
      clientId: SPOTIFY_CLIENT_ID,
      clientSecret: SPOTIFY_CLIENT_SECRET
    })
  }

  getToken = async () => {
    return axios.post('https://accounts.spotify.com/api/token', {
      grant_type: 'client_credentials'
    }, {
      headers: {
        // eslint-disable-next-line quote-props
        'Authorization': `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }).then(response => {
      this.client.setAccessToken(response.data.access_token)
      // debug('Succesfully authenticated Spotify')
    })
  }

  search = async (query) => this.client.searchTracks(query)
}

module.exports = Spotify
