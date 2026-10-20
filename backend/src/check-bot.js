const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const line = require('@line/bot-sdk');

const client = new line.messagingApi.MessagingApiClient({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN
});

async function main() {
  try {
    const botInfo = await client.getBotInfo();
    console.log('SUCCESS_BOT_INFO:', JSON.stringify(botInfo));
  } catch (err) {
    console.error('ERROR_BOT_INFO:', err.message);
  }
}

main();
