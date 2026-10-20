/**
 * LINE Messaging API Service for SoundWave Pass
 * Responsible for sending LINE Flex Message tickets to buyers
 * Developed by: น้ำ (Integration & Scanner Engineer)
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
 * (Based on Nam's exact Flex Message Simulator design)
 */
function createTicketFlexMessage(concert, ticket, zone, booking) {
  // Format concert date
  let dateText = "Monday 25, 9:00PM";
  if (concert?.eventDate) {
    try {
      const d = new Date(concert.eventDate);
      dateText = d.toLocaleDateString('th-TH', { 
        weekday: 'short', 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric' 
      });
    } catch (e) {
      dateText = String(concert.eventDate);
    }
  }

  const concertName = concert?.name || "Sound Wave";
  const placeText = concert?.venue || concert?.location || "Sound Wave Outdoor Park นครปฐม";
  
  let seatText = zone?.name || "Standing Pit B (Soundwave Pit)";
  if (ticket?.seatNumber) {
    seatText += ` - ที่นั่ง ${ticket.seatNumber}`;
  }

  // Exact hero image URL designed by Nam
  const heroImageUrl = "https://i.ibb.co/RpM1nNbS/6c567333-7642-45f0-8f42-ef283393e6b7.webp3";
  const ticketCode = ticket?.ticketCode || "SWP-DEMO-2026";
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(ticketCode)}`;

  // Mobile-accessible network URL (accessible from phone on the same Wi-Fi)
  const appBaseUrl = process.env.PUBLIC_APP_URL || 'http://192.168.0.119:5173';
  const ticketWebUrl = `${appBaseUrl}/tickets/${ticketCode}`;

  return {
    type: "flex",
    altText: `🎸 ตั๋วคอนเสิร์ต ${concertName} ของคุณพร้อมแล้ว!`,
    contents: {
      type: "bubble",
      hero: {
        type: "image",
        url: heroImageUrl,
        size: "full",
        aspectRatio: "20:13",
        aspectMode: "cover",
        action: {
          type: "uri",
          uri: ticketWebUrl
        }
      },
      body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        contents: [
          {
            type: "text",
            text: concertName,
            wrap: true,
            weight: "bold",
            gravity: "center",
            size: "xxl",
            color: "#283B42"
          },
          {
            type: "box",
            layout: "vertical",
            margin: "lg",
            spacing: "sm",
            contents: [
              {
                type: "box",
                layout: "baseline",
                spacing: "sm",
                contents: [
                  {
                    type: "text",
                    text: "Date",
                    color: "#0E0301",
                    size: "md",
                    flex: 1,
                    weight: "bold",
                    decoration: "underline"
                  },
                  {
                    type: "text",
                    text: dateText,
                    wrap: true,
                    size: "sm",
                    color: "#666666",
                    flex: 4
                  }
                ]
              },
              {
                type: "box",
                layout: "baseline",
                spacing: "sm",
                contents: [
                  {
                    type: "text",
                    text: "Place",
                    color: "#0E0301",
                    size: "md",
                    flex: 1,
                    weight: "bold",
                    decoration: "underline"
                  },
                  {
                    type: "text",
                    text: placeText,
                    wrap: true,
                    color: "#666666",
                    size: "sm",
                    flex: 4
                  }
                ]
              },
              {
                type: "box",
                layout: "baseline",
                spacing: "sm",
                contents: [
                  {
                    type: "text",
                    text: "Seats",
                    color: "#0E0301",
                    size: "md",
                    flex: 1,
                    weight: "bold",
                    decoration: "underline"
                  },
                  {
                    type: "text",
                    text: seatText,
                    wrap: true,
                    color: "#666666",
                    size: "sm",
                    flex: 4
                  }
                ]
              },
              {
                type: "box",
                layout: "baseline",
                spacing: "sm",
                contents: [
                  {
                    type: "text",
                    text: "Ticket",
                    color: "#0E0301",
                    size: "md",
                    flex: 1,
                    weight: "bold",
                    decoration: "underline"
                  },
                  {
                    type: "text",
                    text: ticketCode,
                    wrap: true,
                    color: "#283B42",
                    weight: "bold",
                    size: "sm",
                    flex: 4
                  }
                ]
              }
            ]
          },
          {
            "type": "box",
            "layout": "vertical",
            "margin": "xxl",
            "alignItems": "center",
            "contents": [
              {
                "type": "image",
                "url": qrUrl,
                "aspectMode": "cover",
                "size": "xl",
                "margin": "md",
                "action": {
                  "type": "uri",
                  "uri": qrUrl
                }
              },
              {
                "type": "text",
                "text": "You can enter the theater by using this code instead of a ticket",
                "color": "#FFFFFF",
                "wrap": true,
                "margin": "md",
                "size": "xs",
                "align": "center"
              }
            ]
          }
        ],
        background: {
          type: "linearGradient",
          angle: "0deg",
          startColor: "#4B0082",
          endColor: "#ffffff"
        }
      },
      footer: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        contents: [
          {
            type: "button",
            style: "primary",
            color: "#4B0082",
            action: {
              type: "uri",
              label: "🖨️ ดูตั๋วออนไลน์ / พิมพ์บัตร",
              uri: `${appBaseUrl}/tickets/${ticketCode}/print`
            }
          }
        ]
      }
    }
  };
}

/**
 * Push Flex Message Ticket directly to a user's LINE chat
 */
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
