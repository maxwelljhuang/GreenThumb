# GreenThumb Landing Page

A beautiful, Pinterest-inspired coming soon page for GreenThumb with waitlist signup functionality.

## Features

- **Modern Design**: Pinterest-style visual layout with floating product cards
- **Responsive**: Works perfectly on desktop, tablet, and mobile devices
- **Waitlist Signup**: Email capture with client-side validation
- **Animated UI**: Smooth animations and floating effects
- **Lightweight**: Pure HTML, CSS, and JavaScript - no frameworks required

## File Structure

```
frontend/
├── index.html      # Main HTML structure
├── styles.css      # All styling and responsive design
├── script.js       # Form handling and interactivity
└── README.md       # This file
```

## How to View

### Option 1: Open Directly in Browser
Simply double-click `index.html` or open it with your browser.

### Option 2: Use a Local Server (Recommended)

**Using Python:**
```bash
cd frontend
python3 -m http.server 8000
```
Then visit: http://localhost:8000

**Using Node.js (with npx):**
```bash
cd frontend
npx serve
```

**Using VS Code:**
Install the "Live Server" extension and right-click on `index.html` → "Open with Live Server"

## Customization

### Change Colors
Edit `styles.css` and modify the CSS variables in `:root`:
```css
:root {
    --primary-green: #2D5F2E;      /* Main brand color */
    --text-primary: #211f26;        /* Main text color */
    --bg-white: #ffffff;            /* Background color */
}
```

### Update Content
Edit `index.html` to change:
- Hero title and subtitle
- Feature descriptions
- Footer text

### Backend Integration

When your backend is ready, update `script.js` in the `saveToWaitlist()` function:

```javascript
async function saveToWaitlist(email) {
    const response = await fetch('/api/waitlist', {
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

## Current Behavior

- Email addresses are currently saved to `localStorage`
- Form prevents duplicate signups from the same browser
- Success message displays after submission
- No actual backend API calls are made yet

## Next Steps

1. **Add Backend API**: Create a `/api/waitlist` endpoint to store emails in your database
2. **Email Integration**: Set up email notifications (SendGrid, Mailchimp, etc.)
3. **Analytics**: Add Google Analytics or similar tracking
4. **SEO**: Add meta tags for social sharing (Open Graph, Twitter Cards)
5. **Accessibility**: Add ARIA labels and keyboard navigation improvements

## Tech Stack

- Pure HTML5
- CSS3 (Grid, Flexbox, Animations)
- Vanilla JavaScript (ES6+)
- Google Fonts (Inter)

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## License

Part of the GreenThumb project.
