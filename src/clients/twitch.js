require('dotenv').config()
const Twitch = require('tmi.js')

const {
  TWITCH_BOT_USERNAME,
  TWITCH_OAUTH_TOKEN,
  TWITCH_CHANNEL
} = process.env

module.exports = Twitch.Client({
  options: { debug: true },
  identity: {
    username: TWITCH_BOT_USERNAME,
    password: TWITCH_OAUTH_TOKEN
  },
  channels: [TWITCH_CHANNEL]
})
