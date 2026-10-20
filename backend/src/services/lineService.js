/**
 * LINE Messaging API Service for SoundWave Pass
 * Responsible for sending LINE Flex Message tickets to buyers
 */

const line = require('@line/bot-sdk');

const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || '',
  channelSecret: process.env.LINE_CHANNEL_SECRET || '',
};

let client = null;

function getLineClient() {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token || token.trim() === '' || token === 'YOUR_LINE_CHANNEL_ACCESS_TOKEN') {
    return null;
  }
  if (!client) {
    client = new line.messagingApi.MessagingApiClient({
      channelAccessToken: token.trim()
    });
  }
  return client;
}

/**
 * Generate LINE Flex Message Bubble for a Concert Ticket
 */
function createTicketFlexMessage(concert, ticket, zone, booking) {
  return {
    type: "flex",
    altText: `🎸 ตั๋วคอนเสิร์ต ${concert.name} ของคุณพร้อมแล้ว!`,
    contents: {
      type: "bubble",
      size: "giga",
      styles: {
        body: { backgroundColor: "#0a0a0f" },
        footer: { backgroundColor: "#14141e" }
      },
      header: {
        type: "box",
        layout: "vertical",
        backgroundColor: "#11111a",
        paddingAll: "20px",
        contents: [
          {
            type: "text",
            text: "⚡ SOUNDWAVE PASS",
            weight: "bold",
            color: "#00f0ff",
            size: "sm",
            letterSpacing: "2px"
          },
          {
            type: "text",
            text: concert.name,
            weight: "bold",
            color: "#ffffff",
            size: "xl",
            wrap: true,
            margin: "md"
          }
        ]
      },
      body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        contents: [
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "text",
                text: "📅 วันแสดง:",
                color: "#888899",
                size: "sm",
                flex: 2
              },
              {
                type: "text",
                text: new Date(concert.eventDate).toLocaleDateString('th-TH', { dateStyle: 'medium' }),
                color: "#ffffff",
                size: "sm",
                weight: "bold",
                flex: 4
              }
            ]
          },
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "text",
                text: "📍 สถานที่:",
                color: "#888899",
                size: "sm",
                flex: 2
              },
              {
                type: "text",
                text: concert.location,
                color: "#ffffff",
                size: "sm",
                weight: "bold",
                flex: 4
              }
            ]
          },
          {
            type: "separator",
            color: "#2a2a3e",
            margin: "lg"
          },
          {
            type: "box",
            layout: "horizontal",
            margin: "md",
            contents: [
              {
                type: "box",
                layout: "vertical",
                flex: 1,
                contents: [
                  {
                    type: "text",
                    text: "โซนบัตร",
                    color: "#888899",
                    size: "xs"
                  },
                  {
                    type: "text",
                    text: zone.name,
                    color: zone.colorCode || "#00f0ff",
                    weight: "bold",
                    size: "md"
                  }
                ]
              },
              {
                type: "box",
                layout: "vertical",
                flex: 1,
                alignItems: "flex-end",
                contents: [
                  {
                    type: "text",
                    text: "รหัสตั๋ว",
                    color: "#888899",
                    size: "xs"
                  },
                  {
                    type: "text",
                    text: ticket.ticketCode,
                    color: "#ffffff",
                    weight: "bold",
                    size: "md"
                  }
                ]
              }
            ]
          },
          {
            type: "box",
            layout: "vertical",
            backgroundColor: "#ffffff",
            cornerRadius: "md",
            paddingAll: "10px",
            margin: "lg",
            alignItems: "center",
            contents: [
              {
                type: "image",
                url: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${ticket.ticketCode}`,
                size: "xl",
                aspectRatio: "1:1",
                aspectMode: "fit"
              },
              {
                type: "text",
                text: "ใช้ QR Code นี้สแกนเข้าประตูหน้างาน",
                size: "xxs",
                color: "#666666",
                margin: "sm"
              }
            ]
          }
        ]
      },
      footer: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        contents: [
          {
            type: "button",
            style: "primary",
            color: "#00f0ff",
            action: {
              type: "uri",
              label: "🖨️ พิมพ์บัตรที่ระลึก A4",
              uri: `http://localhost:5173/tickets/${ticket.ticketCode}/print`
            }
          }
        ]
      }
    }
  };
}

async function sendTicketToLineUser(userId, concert, ticket, zone, booking) {
  const lineClient = getLineClient();
  if (!lineClient || !userId) {
    console.log(`[LINE Service] Skipped: No valid client or LINE userId (Simulated mode: Ticket for ${userId || 'guest'})`);
    return { success: false, reason: "Line client not configured or no userId" };
  }

  try {
    const flexMessage = createTicketFlexMessage(concert, ticket, zone, booking);
    await lineClient.pushMessage({
      to: userId,
      messages: [flexMessage]
    });
    console.log(`[LINE Service] ✅ Flex Message successfully sent to ${userId}`);
    return { success: true };
  } catch (error) {
    console.error(`[LINE Service] ❌ Error sending Flex Message:`, error.message);
    return { success: false, error: error.message };
  }
}

module.exports = {
  createTicketFlexMessage,
  sendTicketToLineUser
};
