require('dotenv').config()
const LastFmApi = require('lastfm').LastFmNode

const {
  LASTFM_CLIENT_ID,
  LASTFM_CLIENT_SECRET,
  LASTFM_USERNAME
} = process.env

class LastFm {
  constructor() {
    this.client = new LastFmApi({
      api_key: LASTFM_CLIENT_ID,
      secret: LASTFM_CLIENT_SECRET
    })
    this.stream = this.client.stream(LASTFM_USERNAME)
  }

  connect = () => this.stream.start()

  onScrobble = (callback) => this.stream.on('nowPlaying', callback)
}

module.exports = LastFm
