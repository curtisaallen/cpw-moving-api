# CPW Moving Co. — Railway Quote Form Backend

## Deploy to Railway
1. Put this folder in its own GitHub repository (or deploy it with Railway CLI).
2. Railway > New Project > Deploy from GitHub repo > select this repo.
3. Under the service's **Variables** add:
   - `EMAIL_USER` = `curtisaallen@gmail.com`
   - `EMAIL_APP_PASSWORD` = your **Google App Password** (not your Gmail login password; do not share it)
   - `ALLOWED_ORIGINS` = `https://cpwmoving.com,https://www.cpwmoving.com,https://delicate-block-b016.curtisaallen.workers.dev`
4. In Railway service **Settings > Networking**, generate a public domain.
5. Open `https://YOUR-RAILWAY-DOMAIN/health` to check that the server is running.

## Connect your existing Cloudflare website
1. Copy `frontend-form.js` into your site's public/root folder.
2. Replace the placeholder `QUOTE_API_URL` with your real Railway URL + `/api/quote`.
3. Include `<script src="/frontend-form.js" defer></script>` before `</head>` or `</body>` on every page containing the quote form.
4. Remove `data-netlify`, `netlify-honeypot`, and the `form-name` hidden field from the old form (optional but recommended). Keep `name="moving-quote"` and existing input names.
5. Deploy your website to Cloudflare. Submit a test quote and confirm BOTH recipients receive it. Check spam/junk folders too.

## Gmail setup
- Enable Google 2-Step Verification on the sending Gmail account.
- Create a Google App Password at https://myaccount.google.com/apppasswords (availability depends on Google account security settings).
- Add the app password to Railway Variables; NEVER commit it to code or share it in chat.
- Gmail SMTP may have sending limits and business-deliverability limitations. If sending fails, check Railway logs and consider a transactional email provider.

## Security and operations
- Browser origin restrictions (CORS) are NOT authentication and do not prevent direct requests by bots.
- This starter includes a hidden honeypot, basic field validation and an in-memory IP rate limiter. For production, add Cloudflare Turnstile with SERVER-SIDE verification. In-memory rate limiting is not shared between instances and resets on restart.
- Ensure your privacy policy explains that customer contact details are emailed to CPW's designated recipients. Consider whether the recipient at `jrautomation.com` is approved to receive customer data.
- Do not use a real customer submission as your first test. Use dummy data.
