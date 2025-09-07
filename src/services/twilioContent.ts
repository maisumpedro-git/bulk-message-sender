import Twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

let client: Twilio.Twilio | null = null;
function getClient() {
  if (!client) {
    if (!accountSid || !authToken) throw new Error('Twilio credentials missing');
    client = Twilio(accountSid, authToken);
  }
  return client;
}

export interface ContentTemplateResult {
  id: string;
  name: string;
  hasVariables: boolean;
}

// Placeholder: Twilio Content API isn't fully covered by twilio SDK (depending on version) so treat as fetch if needed.
export async function listContentTemplates(page: number, pageSize = 10): Promise<{ items: ContentTemplateResult[]; hasMore: boolean; page: number; }> {
  // For now we just mock but this is where real API call would go.
  const items = Array.from({ length: pageSize }).map((_, i) => ({
    id: `twilio-template-${page}-${i}`,
    name: `Twilio Template ${page}-${i}`,
    hasVariables: i % 2 === 0
  }));
  return { items, hasMore: page < 5, page };
}
