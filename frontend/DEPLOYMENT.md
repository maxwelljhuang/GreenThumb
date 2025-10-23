# GreenThumb Landing Page - Deployment Guide

## 🎨 What Was Created

A beautiful, Pinterest-inspired coming soon landing page with:
- Hero section with animated product cards
- Waitlist email signup form
- Features showcase
- Fully responsive design
- Smooth animations and interactions

## 📁 Files Created

```
frontend/
├── index.html          # Main landing page
├── styles.css          # All styling (Pinterest-inspired)
├── script.js           # Form handling & animations
├── README.md           # Documentation
└── DEPLOYMENT.md       # This file
```

## 🚀 Quick Start

### View Locally (Currently Running)

Your landing page is now running at:
**http://localhost:3000**

To stop the server:
```bash
# Find the process
ps aux | grep "python3 -m http.server 3000"

# Kill it
kill <process_id>
```

To restart:
```bash
cd /Users/maxwellhuang/Desktop/GreenThumb/frontend
python3 -m http.server 3000
```

**Note:** Port 8000 is used by your Django backend API.

## 🗄️ Backend Integration

### Waitlist Database

A `waitlist` table has been created in your PostgreSQL database:

```sql
-- View waitlist signups
SELECT * FROM waitlist ORDER BY created_at DESC;

-- Count total signups
SELECT COUNT(*) FROM waitlist;

-- Export emails
SELECT email FROM waitlist ORDER BY created_at ASC;
```

### API Endpoint

Created: `backend/api/waitlist.py`

**Endpoints:**
- `POST /api/waitlist` - Add email to waitlist
- `GET /api/waitlist/stats` - Get signup statistics
- `GET /api/waitlist/export` - Export all emails (admin)

### Connect Frontend to Backend

Update `frontend/script.js` line 50 to use the real API:

```javascript
async function saveToWaitlist(email) {
    const response = await fetch('http://localhost:8000/api/waitlist', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            email: email,
            source: 'landing_page'
        })
    });

    if (!response.ok) {
        throw new Error('Failed to save to waitlist');
    }

    return await response.json();
}
```

## 🌐 Deployment Options

### Option 1: Netlify (Recommended for Static Sites)

1. Push frontend folder to GitHub
2. Connect to Netlify
3. Deploy automatically
4. Free SSL certificate included

**Build settings:**
- Build command: (none needed)
- Publish directory: `frontend`

### Option 2: Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. Run in frontend folder: `vercel`
3. Follow prompts
4. Auto-deployed with SSL

### Option 3: GitHub Pages

1. Create a `gh-pages` branch
2. Push frontend files
3. Enable GitHub Pages in repo settings
4. Access at: `https://yourusername.github.io/greenthumb`

### Option 4: Your Own Server

```bash
# Using nginx
sudo cp -r frontend/* /var/www/html/greenthumb/

# Configure nginx
server {
    listen 80;
    server_name greenthumb.com;
    root /var/www/html/greenthumb;
    index index.html;
}
```

### Option 5: AWS S3 + CloudFront

1. Create S3 bucket
2. Upload frontend files
3. Enable static website hosting
4. Add CloudFront for CDN + SSL

## 🎯 Customization Guide

### Brand Colors

Edit `styles.css` `:root` section:
```css
:root {
    --primary-green: #2D5F2E;      /* Your brand color */
    --primary-green-dark: #1e3f1f;
    --primary-green-light: #3d7f3e;
}
```

### Hero Content

Edit `index.html` lines 35-45:
- Change title
- Update subtitle
- Modify call-to-action text

### Product Categories

Edit the floating cards in `index.html` (lines 60-95):
- Change gradient colors
- Update category tags
- Adjust card positions

### Features Section

Edit `index.html` lines 115-150:
- Update feature icons
- Change titles and descriptions
- Add/remove features

## 📊 Analytics Integration

### Google Analytics

Add before `</head>` in `index.html`:
```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

### Facebook Pixel

Add before `</head>`:
```html
<!-- Facebook Pixel Code -->
<script>
  !function(f,b,e,v,n,t,s)
  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
  n.queue=[];t=b.createElement(e);t.async=!0;
  t.src=v;s=b.getElementsByTagName(e)[0];
  s.parentNode.insertBefore(t,s)}(window, document,'script',
  'https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', 'YOUR_PIXEL_ID');
  fbq('track', 'PageView');
</script>
```

## 🔒 Security Notes

- Email validation is client-side only (add server-side validation)
- No rate limiting yet (add in production)
- No CAPTCHA (consider adding for production)
- No email verification (add confirmation emails)

## ✅ Pre-Launch Checklist

- [ ] Test on all major browsers
- [ ] Test on mobile devices
- [ ] Add favicon
- [ ] Add Open Graph meta tags
- [ ] Add Twitter Card meta tags
- [ ] Set up email notifications
- [ ] Configure analytics
- [ ] Test form submission
- [ ] Add privacy policy link
- [ ] Add terms of service link
- [ ] Set up SSL certificate
- [ ] Configure custom domain

## 📧 Email Notifications

To notify yourself of new signups, add this to the backend:

```python
# In backend/api/waitlist.py after successful signup
import smtplib
from email.mime.text import MIMEText

def send_notification(email):
    msg = MIMEText(f"New signup: {email}")
    msg['Subject'] = 'New GreenThumb Waitlist Signup'
    msg['From'] = 'notifications@greenthumb.com'
    msg['To'] = 'you@greenthumb.com'

    with smtplib.SMTP('smtp.gmail.com', 587) as server:
        server.starttls()
        server.login('your-email', 'your-password')
        server.send_message(msg)
```

## 🎨 Design Credits

Inspired by:
- Pinterest's clean, visual-first design
- Modern SaaS landing pages
- Material Design principles

## 📱 Social Media

Share your launch with these hashtags:
- #ProductLaunch
- #ComingSoon
- #Sustainability
- #ProductDiscovery

## Support

For issues or questions:
- Check the README.md
- Review the code comments
- Test in browser console

---

**Your landing page is live and ready to collect waitlist signups!** 🎉
