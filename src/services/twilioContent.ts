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
  id: string;              // Twilio Content SID
  name: string;            // Friendly name
  type: 'twilio/text' | 'twilio/media' | string; // Primary supported type
  body: string;            // Text body (for twilio/text) or caption/first body if media
  variables: string[];     // Numeric placeholders like ['1','2']
  hasVariables: boolean;   // Convenience flag
}

// Real Twilio Content API integration (Content & Approvals)
// Docs: https://www.twilio.com/docs/content-api
// We use basic auth with Account SID + Auth Token and Twilio's paging (PageSize + Page)
export async function listContentTemplates(page: number, pageSize = 50): Promise<{ items: ContentTemplateResult[]; hasMore: boolean; page: number; }> {
  // If credentials not present fallback to empty list to avoid runtime crash
  if (!accountSid || !authToken) {
    return { items: [], hasMore: false, page };
  }
  const url = new URL('https://content.twilio.com/v1/ContentAndApprovals');
  url.searchParams.set('PageSize', String(pageSize));
  // Twilio 'Page' is zero-based; our external page is 1-based
  const twilioPage = Math.max(page - 1, 0);
  url.searchParams.set('Page', String(twilioPage));
  try {
    const res = await fetch(url.toString(), {
      headers: {
        Authorization: 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64')
      },
      // Force GET (fetch defaults) - keep explicit for clarity
      method: 'GET'
    });
    if (!res.ok) {
      const text = await res.text();
      console.error('Twilio Content API error', res.status, text);
      return { items: [], hasMore: false, page };
    }
    const data: any = await res.json();
    const rawItems: any[] = data?.content_and_approvals || data?.contents || [];
    // Only "approved" templates
    const approved = rawItems.filter(r => {
      const status = r?.approval_requests?.status || r?.approval_requests?.approval_request_status || r?.approval_requests?.[0]?.status;
      return status === 'approved';
    });
    const items: ContentTemplateResult[] = approved.map(mapTwilioContentToTemplate)
      // Only keep supported types for now (text & media)
      .filter(i => i.type === 'twilio/text' || i.type === 'twilio/media');
    const hasMore = !!data?.meta?.next_page_url;
    return { items, hasMore, page };
  } catch (e) {
    console.error('Twilio Content fetch exception', e);
    return { items: [], hasMore: false, page };
  }
}

function mapTwilioContentToTemplate(obj: any): ContentTemplateResult {
  const id = obj?.sid || obj?.id || obj?.content_sid || 'unknown';
  const name = obj?.friendly_name || obj?.name || obj?.approval?.friendly_name || id;
  const types = obj?.types || {};
  // Determine primary type preference: twilio/text over twilio/media
  let primaryType: string = 'twilio/text';
  if (types['twilio/text']) primaryType = 'twilio/text';
  else if (types['twilio/media']) primaryType = 'twilio/media';
  else if (Object.keys(types).length) primaryType = Object.keys(types)[0];

  // Extract body for text; for media try caption/body fields.
  let body = '';
  if (primaryType === 'twilio/text') {
    body = types['twilio/text']?.body || '';
  } else if (primaryType === 'twilio/media') {
    body = types['twilio/media']?.body || types['twilio/media']?.caption || '';
  }

  // Variable placeholders are numeric like {{1}}, {{2}}
  const varRegexGlobal = /\{\{\s*(\d+)\s*\}\}/g;
  const found: Set<string> = new Set();
  let match: RegExpExecArray | null;
  while ((match = varRegexGlobal.exec(body)) !== null) {
    found.add(match[1]);
  }
  const variables = Array.from(found).sort((a, b) => Number(a) - Number(b));
  return {
    id,
    name,
    type: primaryType,
    body,
    variables,
    hasVariables: variables.length > 0
  };
}
