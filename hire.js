// Vercel serverless function: sends hire inquiries to your Discord DMs via a bot.
// Env vars (set in Vercel → Project → Settings → Environment Variables):
//   DISCORD_BOT_TOKEN  – your bot's token
//   OWNER_ID           – your Discord user ID (1347129235898237010)

const API = 'https://discord.com/api/v10';
const clip = (v, n) => String(v || '').trim().slice(0, n);

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const token = process.env.DISCORD_BOT_TOKEN;
  const ownerId = process.env.OWNER_ID || '1347129235898237010';
  if (!token) return res.status(500).json({ error: 'Server not configured' });

  const body = req.body || {};
  if (body.website) return res.status(200).json({ ok: true }); // honeypot: bots fill this in

  const projectType = clip(body.project_type, 100);
  if (!projectType) return res.status(400).json({ error: 'Project type is required' });

  const embed = {
    title: 'New hire inquiry',
    color: 0x8b7bff,
    fields: [
      { name: 'Name', value: clip(body.name, 200) || '—' },
      { name: 'Contact', value: clip(body.contact, 200) || '—' },
      { name: 'Project type', value: projectType },
      { name: 'Payment', value: clip(body.payment, 300) || '—' },
      { name: 'Timeline', value: clip(body.timeline, 300) || '—' },
      { name: 'Project details', value: clip(body.details, 1000) || '—' }
    ],
    timestamp: new Date().toISOString()
  };

  const headers = { Authorization: `Bot ${token}`, 'Content-Type': 'application/json' };

  try {
    // Open (or fetch) the DM channel with you
    const dm = await fetch(`${API}/users/@me/channels`, {
      method: 'POST', headers, body: JSON.stringify({ recipient_id: ownerId })
    });
    if (!dm.ok) return res.status(502).json({ error: 'Could not open DM' });
    const { id: channelId } = await dm.json();

    const msg = await fetch(`${API}/channels/${channelId}/messages`, {
      method: 'POST', headers,
      body: JSON.stringify({ embeds: [embed], allowed_mentions: { parse: [] } })
    });
    if (!msg.ok) return res.status(502).json({ error: 'Could not send DM' });

    return res.status(200).json({ ok: true });
  } catch {
    return res.status(500).json({ error: 'Unexpected error' });
  }
};
