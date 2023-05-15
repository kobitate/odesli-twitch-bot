require('dotenv').config()
const TwitchChat = require('tmi.js')

const {
  TWITCH_BOT_USERNAME,
  TWITCH_OAUTH_TOKEN,
  TWITCH_CHANNEL
} = process.env

class Twitch {
  constructor() {
    this.client = TwitchChat.Client({
      options: { debug: true },
      identity: {
        username: TWITCH_BOT_USERNAME,
        password: TWITCH_OAUTH_TOKEN
      },
      channels: [TWITCH_CHANNEL]
    })
  }

  connect = () => this.client.connect()

  sendMessage = (message) => this.client.say(TWITCH_CHANNEL, message)

  onMessage = (callback) =>
    this.client.on('message', (_channel, user, message) =>
      callback(user, message.toLowerCase())) // automatically lowercase the message :)
}

module.exports = Twitch
