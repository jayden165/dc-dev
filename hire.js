// Vercel serverless function: sends hire inquiries to your Discord DMs via a bot.
// Env vars (Vercel → Project → Settings → Environment Variables):
//   DISCORD_BOT_TOKEN  – your bot's token
//   OWNER_ID           – your Discord user ID (1347129235898237010)

const API = 'https://discord.com/api/v10';
const clip = (v, n) => String(v || '').trim().slice(0, n);

module.exports = async (req, res) => {
  const token = (process.env.DISCORD_BOT_TOKEN || '').trim().replace(/^Bot\s+/i, '');
  const ownerId = (process.env.OWNER_ID || '1347129235898237010').trim();

  // Health check: open /api/hire in your browser to see if setup is detected
  if (req.method === 'GET') {
    return res.status(200).json({ ok: true, tokenSet: Boolean(token), ownerId });
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!token) {
    return res.status(500).json({ error: 'DISCORD_BOT_TOKEN is not set on Vercel. Add it and redeploy.' });
  }

  let body = req.body || {};
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  if (body.website) return res.status(200).json({ ok: true }); // honeypot

  const projectType = clip(body.project_type, 100);
  if (!projectType) return res.status(400).json({ error: 'Please choose a project type.' });

  const embed = {
    title: 'New hire inquiry',
    color: 0x7c83ff,
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

  const headers = {
    Authorization: `Bot ${token}`,
    'Content-Type': 'application/json',
    'User-Agent': 'DiscordBot (savage-customs-portfolio, 1.0)'
  };

  try {
    const dm = await fetch(`${API}/users/@me/channels`, {
      method: 'POST', headers, body: JSON.stringify({ recipient_id: ownerId })
    });
    if (!dm.ok) {
      const d = await dm.json().catch(() => ({}));
      console.error('Open DM failed', dm.status, d);
      const reason = dm.status === 401
        ? 'Discord rejected the bot token. Reset it in the Developer Portal and update DISCORD_BOT_TOKEN.'
        : `Could not open a DM with the owner (Discord ${dm.status}${d.code ? ', code ' + d.code : ''}). Check OWNER_ID.`;
      return res.status(502).json({ error: reason });
    }
    const { id: channelId } = await dm.json();

    const msg = await fetch(`${API}/channels/${channelId}/messages`, {
      method: 'POST', headers,
      body: JSON.stringify({ embeds: [embed], allowed_mentions: { parse: [] } })
    });
    if (!msg.ok) {
      const d = await msg.json().catch(() => ({}));
      console.error('Send DM failed', msg.status, d);
      const reason = d.code === 50007
        ? 'Discord blocked the DM. The bot must share a server with you and your DMs must be open for that server.'
        : `Discord refused the message (${msg.status}${d.code ? ', code ' + d.code : ''}).`;
      return res.status(502).json({ error: reason });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Unexpected server error. Check the Vercel logs.' });
  }
};
