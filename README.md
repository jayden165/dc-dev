# Mr Savage – Discord Developer Portfolio

Static portfolio site (HTML/CSS/JS) plus one Vercel serverless function that DMs hire inquiries to you on Discord.

## Files
- `index.html`, `pricing.html`, `hire.html` – pages
- `style.css`, `script.js` – styles and form logic
- `api/hire.js` – serverless function that sends the inquiry to your DMs

## Setup: hire form → your Discord DMs
1. Go to https://discord.com/developers/applications → New Application → **Bot** tab → Reset Token and copy it.
2. Invite the bot to a server you are also in (OAuth2 → URL Generator → scope `bot`). A bot can only DM you if you share a server with it.
3. In Discord, make sure DMs from server members are allowed (Server → Privacy Settings), at least for that server.
4. Deploy to Vercel (import the GitHub repo) and add environment variables:
   - `DISCORD_BOT_TOKEN` = your bot token
   - `OWNER_ID` = `1347129235898237010`
5. Redeploy. Submit the form to test.

The bot does not need to be running or hosted anywhere else; the function just calls Discord's API when the form is submitted.

**Never put the bot token in the HTML/JS or commit it to GitHub.** If it leaks, reset it in the Developer Portal.

## Note
`api/hire.js` only works on Vercel (or another host that runs serverless functions). GitHub Pages is static-only and will not run it.
