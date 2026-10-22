/**
 * LINE Messaging API Service for SoundWave Pass
 * Responsible for sending LINE Flex Message tickets to buyers
 * Developed by: น้ำ (Integration & Scanner Engineer)
 */

const line = require('@line/bot-sdk');
const os = require('os');

const config = {
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || '',
  channelSecret: process.env.LINE_CHANNEL_SECRET || '',
};

let client = null;

function getAppBaseUrl() {
  const configuredUrl = process.env.PUBLIC_APP_URL?.trim();
  if (configuredUrl) return configuredUrl.replace(/\/+$/, '');

  const callbackUrl = process.env.LINE_LOGIN_CALLBACK_URL?.trim();
  if (callbackUrl) {
    try {
      const callbackOrigin = new URL(callbackUrl).origin;
      if (!['localhost', '127.0.0.1'].includes(new URL(callbackOrigin).hostname)) return callbackOrigin;
    } catch {
      /* Fall back to the local development address. */
    }
  }

  // Resolve the current LAN address for local development instead of using a stale IP.
  const addresses = Object.values(os.networkInterfaces()).flat().filter(Boolean);
  const lanAddress =
    addresses.find((entry) => entry.family === 'IPv4' && !entry.internal && /^192\.168\./.test(entry.address)) ||
    addresses.find((entry) => entry.family === 'IPv4' && !entry.internal);
  if (lanAddress) return `http://${lanAddress.address}:5173`;
  return 'http://localhost:5173';
}

function getLineClient() {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token || token.trim() === '' || token === 'YOUR_LINE_CHANNEL_ACCESS_TOKEN') {
    return null;
  }
  if (!client) {
    client = new line.messagingApi.MessagingApiClient({
      channelAccessToken: token.trim(),
    });
  }
  return client;
}

async function getLineBotInfo() {
  const lineClient = getLineClient();
  if (!lineClient) return null;
  return lineClient.getBotInfo();
}

/**
 * Helper: Extract all seats selected in a booking
 */
function extractAllSeats(booking, ticket, allTickets = []) {
  let allSeatsList = [];
  if (booking?.selectedSeats) {
    try {
      const parsed =
        typeof booking.selectedSeats === 'string' ? JSON.parse(booking.selectedSeats) : booking.selectedSeats;
      if (Array.isArray(parsed) && parsed.length > 0) {
        allSeatsList = parsed;
      }
    } catch (e) {}
  }

  if (!allSeatsList.length && Array.isArray(allTickets) && allTickets.length > 0) {
    allSeatsList = allTickets.map((t) => t.seatNumber).filter(Boolean);
  }

  if (!allSeatsList.length && ticket?.seatNumber) {
    allSeatsList = [ticket.seatNumber];
  }

  return allSeatsList;
}

/**
 * Generate a single LINE Flex Message Bubble for a ticket
 */
function createTicketBubble(concert, ticket, zone, booking, allSeatsList = [], ticketIndex = 0, totalTickets = 1) {
  let dateText = 'Monday 25, 9:00PM';
  if (concert?.eventDate) {
    try {
      const d = new Date(concert.eventDate);
      dateText = d.toLocaleDateString('th-TH', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch (e) {
      dateText = String(concert.eventDate);
    }
  }

  const concertName = concert?.name || 'Sound Wave';
  const placeText = concert?.venue || concert?.location || 'Sound Wave Outdoor Park';
  const zoneName = zone?.name || 'Main Zone';

  // Format all chosen seats string (e.g. "A-01, A-02")
  const allSeatsStr = allSeatsList.length > 0 ? allSeatsList.join(', ') : ticket?.seatNumber || '-';

  // Exact hero image URL designed by Nam
  const heroImageUrl = 'https://i.ibb.co/RpM1nNbS/6c567333-7642-45f0-8f42-ef283393e6b7.webp3';
  const ticketCode = ticket?.ticketCode || 'SWP-DEMO-2026';
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(ticketCode)}`;

  const appBaseUrl = getAppBaseUrl();
  const ticketWebUrl = `${appBaseUrl}/tickets/${ticketCode}`;

  const rows = [
    {
      type: 'box',
      layout: 'baseline',
      spacing: 'sm',
      contents: [
        { type: 'text', text: 'Date', color: '#0E0301', size: 'md', flex: 1, weight: 'bold', decoration: 'underline' },
        { type: 'text', text: dateText, wrap: true, size: 'sm', color: '#666666', flex: 4 },
      ],
    },
    {
      type: 'box',
      layout: 'baseline',
      spacing: 'sm',
      contents: [
        { type: 'text', text: 'Place', color: '#0E0301', size: 'md', flex: 1, weight: 'bold', decoration: 'underline' },
        { type: 'text', text: placeText, wrap: true, color: '#666666', size: 'sm', flex: 4 },
      ],
    },
    {
      type: 'box',
      layout: 'baseline',
      spacing: 'sm',
      contents: [
        { type: 'text', text: 'Zone', color: '#0E0301', size: 'md', flex: 1, weight: 'bold', decoration: 'underline' },
        { type: 'text', text: zoneName, wrap: true, color: '#666666', size: 'sm', flex: 4 },
      ],
    },
    // Seats row: ขึ้นทุกที่นั่งที่กดไปด้วย
    {
      type: 'box',
      layout: 'baseline',
      spacing: 'sm',
      contents: [
        { type: 'text', text: 'Seats', color: '#0E0301', size: 'md', flex: 1, weight: 'bold', decoration: 'underline' },
        {
          type: 'text',
          text: allSeatsList.length > 1 ? `${allSeatsStr} (รวม ${allSeatsList.length} ที่นั่ง)` : allSeatsStr,
          wrap: true,
          color: '#283B42',
          weight: 'bold',
          size: 'sm',
          flex: 4,
        },
      ],
    },
  ];

  // If there are multiple seats, indicate which specific seat this QR code corresponds to
  if (totalTickets > 1 && ticket?.seatNumber) {
    rows.push({
      type: 'box',
      layout: 'baseline',
      spacing: 'sm',
      contents: [
        { type: 'text', text: 'Pass', color: '#0E0301', size: 'md', flex: 1, weight: 'bold', decoration: 'underline' },
        {
          type: 'text',
          text: `ที่นั่งใบนี้: ${ticket.seatNumber} (ตั๋วใบที่ ${ticketIndex + 1}/${totalTickets})`,
          wrap: true,
          color: '#4B0082',
          weight: 'bold',
          size: 'sm',
          flex: 4,
        },
      ],
    });
  }

  // Ticket Code row
  rows.push({
    type: 'box',
    layout: 'baseline',
    spacing: 'sm',
    contents: [
      { type: 'text', text: 'Ticket', color: '#0E0301', size: 'md', flex: 1, weight: 'bold', decoration: 'underline' },
      { type: 'text', text: ticketCode, wrap: true, color: '#283B42', weight: 'bold', size: 'sm', flex: 4 },
    ],
  });

  return {
    type: 'bubble',
    hero: {
      type: 'image',
      url: heroImageUrl,
      size: 'full',
      aspectRatio: '20:13',
      aspectMode: 'cover',
      action: {
        type: 'uri',
        uri: ticketWebUrl,
      },
    },
    body: {
      type: 'box',
      layout: 'vertical',
      spacing: 'md',
      contents: [
        {
          type: 'text',
          text: totalTickets > 1 ? `${concertName} (${ticketIndex + 1}/${totalTickets})` : concertName,
          wrap: true,
          weight: 'bold',
          gravity: 'center',
          size: 'xl',
          color: '#283B42',
        },
        {
          type: 'box',
          layout: 'vertical',
          margin: 'lg',
          spacing: 'sm',
          contents: rows,
        },
        {
          type: 'box',
          layout: 'vertical',
          margin: 'xxl',
          alignItems: 'center',
          contents: [
            {
              type: 'image',
              url: qrUrl,
              aspectMode: 'cover',
              size: 'xl',
              margin: 'md',
              action: {
                type: 'uri',
                uri: qrUrl,
              },
            },
            {
              type: 'text',
              text: 'You can enter the theater by using this code instead of a ticket',
              color: '#FFFFFF',
              wrap: true,
              margin: 'md',
              size: 'xs',
              align: 'center',
            },
          ],
        },
      ],
      background: {
        type: 'linearGradient',
        angle: '0deg',
        startColor: '#4B0082',
        endColor: '#ffffff',
      },
    },
    footer: {
      type: 'box',
      layout: 'vertical',
      spacing: 'sm',
      contents: [
        {
          type: 'button',
          style: 'primary',
          color: '#4B0082',
          action: {
            type: 'uri',
            label: 'ดูตั๋วออนไลน์',
            uri: ticketWebUrl,
          },
        },
        {
          type: 'button',
          style: 'secondary',
          action: {
            type: 'uri',
            label: 'พิมพ์ตั๋วที่ระลึก',
            uri: `${appBaseUrl}/tickets/${ticketCode}/print`,
          },
        },
      ],
    },
  };
}

/**
 * Generate LINE Flex Message (Bubble or Carousel) showing all chosen seats
 */
function createTicketFlexMessage(concert, ticket, zone, booking, allTickets = []) {
  const allSeatsList = extractAllSeats(booking, ticket, allTickets);
  const concertName = concert?.name || 'Sound Wave';
  const allSeatsStr = allSeatsList.length > 0 ? allSeatsList.join(', ') : ticket?.seatNumber || '-';

  if (Array.isArray(allTickets) && allTickets.length > 1) {
    const bubbles = allTickets.map((t, idx) =>
      createTicketBubble(concert, t, zone, booking, allSeatsList, idx, allTickets.length)
    );
    return {
      type: 'flex',
      altText: `🎸 ตั๋วคอนเสิร์ต ${concertName} ที่นั่ง: ${allSeatsStr} ของคุณพร้อมแล้ว!`,
      contents: {
        type: 'carousel',
        contents: bubbles,
      },
    };
  }

  return {
    type: 'flex',
    altText: `🎸 ตั๋วคอนเสิร์ต ${concertName} ที่นั่ง: ${allSeatsStr} ของคุณพร้อมแล้ว!`,
    contents: createTicketBubble(concert, ticket, zone, booking, allSeatsList, 0, 1),
  };
}

/**
 * Push Flex Message Ticket directly to a user's LINE chat
 */
async function sendTicketToLineUser(userId, concert, ticket, zone, booking, allTickets = []) {
  const lineClient = getLineClient();
  if (!lineClient || !userId) {
    console.log(`[LINE Service] Skipped: No valid client or LINE userId (Simulated mode: Ticket for ${userId || 'guest'})`);
    return { success: false, reason: 'Line client not configured or no userId' };
  }

  try {
    const flexMessage = createTicketFlexMessage(concert, ticket, zone, booking, allTickets);
    await lineClient.pushMessage({
      to: userId,
      messages: [flexMessage],
    });
    console.log(`[LINE Service] ✅ Flex Message successfully sent to ${userId}`);
    return { success: true };
  } catch (error) {
    console.error(`[LINE Service] ❌ Error sending Flex Message:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Push All Tickets from a Booking to a user's LINE chat
 */
async function sendTicketsToLineUser(userId, concert, tickets, zone, booking) {
  const ticketList = Array.isArray(tickets) && tickets.length > 0 ? tickets : [tickets];
  return sendTicketToLineUser(userId, concert, ticketList[0], zone, booking, ticketList);
}

module.exports = {
  createTicketBubble,
  createTicketFlexMessage,
  sendTicketToLineUser,
  sendTicketsToLineUser,
  getLineBotInfo,
};
