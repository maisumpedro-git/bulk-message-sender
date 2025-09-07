import Twilio from 'twilio';

export function getTwilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!accountSid || !authToken) {
    throw new Error('Twilio credentials not configured');
  }
  return Twilio(accountSid, authToken);
}

export async function sendMessage(from: string, to: string, body: string) {
  const client = getTwilioClient();
  const msg = await client.messages.create({ from, to, body });
  return msg.sid;
}
