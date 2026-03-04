# DRPL Email Server — Setup & Deployment

## Install

```bash
cd drpl-email-server
npm install
```

## Configure

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Fill in your actual credentials in `.env`.

3. Add domains in `src/config/domains.js` — each domain needs FTP credentials and upload path.

## Run

```bash
# Development
npm run dev

# Production
npm start
```

## Deploy on VPS

1. **Install Node.js** (v18+):
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt install -y nodejs
   ```

2. **Clone and install**:
   ```bash
   git clone <your-repo> /opt/drpl-email-server
   cd /opt/drpl-email-server
   npm install --production
   cp .env.example .env
   # Edit .env with real values
   ```

3. **Run with PM2** (process manager):
   ```bash
   sudo npm install -g pm2
   pm2 start src/server.js --name drpl-email-server
   pm2 save
   pm2 startup
   ```

4. **Nginx reverse proxy** (recommended):
   ```nginx
   server {
       listen 80;
       server_name api.yourdomain.com;

       location / {
           proxy_pass http://127.0.0.1:3000;
           proxy_set_header X-Forwarded-For $remote_addr;
           proxy_set_header Host $host;
           proxy_set_header Origin $http_origin;
       }
   }
   ```
   Then enable HTTPS with Certbot:
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d api.yourdomain.com
   ```

## cPanel Setup

For each domain, create an FTP account in cPanel:
1. Go to **FTP Accounts** in cPanel
2. Create a user (e.g., `uploads@dotryder.com`)
3. Set the directory to `/public_html/uploads`
4. Make sure the `/public_html/uploads` directory exists

## Frontend Example

```html
<form id="contactForm" enctype="multipart/form-data">
  <input type="text" name="name" placeholder="Name" required />
  <input type="email" name="email" placeholder="Email" required />
  <input type="tel" name="phone" placeholder="Phone" />
  <textarea name="message" placeholder="Message" required></textarea>
  <input type="file" name="file" accept=".pdf,.doc,.docx,.jpg,.png" />
  <button type="submit">Send</button>
</form>

<script>
  document.getElementById("contactForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    try {
      const res = await fetch("https://api.yourdomain.com/contact", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        alert("Message sent successfully!");
      } else {
        alert("Error: " + data.error);
      }
    } catch (err) {
      alert("Network error. Please try again.");
    }
  });
</script>
```

## API Reference

### `POST /contact`

- **Content-Type**: `multipart/form-data`
- **Fields**: Any key-value pairs (name, email, phone, message, etc.)
- **File field**: `file` (optional, max 10MB, allowed: pdf/doc/docx/jpg/png)
- **Origin header**: Must match a configured domain

**Success response** (200):
```json
{
  "success": true,
  "message": "Form submitted successfully.",
  "fileUrl": "https://dotryder.com/uploads/1719930000_ab12cd_resume.pdf"
}
```

**Error responses**: 400, 403, 413, 429, 500 with `{ "error": "..." }`

### `GET /health`

Returns `{ "status": "ok" }` — useful for uptime monitoring.
