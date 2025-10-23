// Enhanced Waitlist Form Handler with 3D Effects
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('waitlistForm');
    const successMessage = document.getElementById('successMessage');
    const emailInput = document.getElementById('email');

    // Initialize 3D tilt effect on product cards
    init3DTilt();

    // Add scroll effects to navbar
    initNavbarScroll();

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        const email = emailInput.value.trim();

        if (!email || !isValidEmail(email)) {
            showError('Please enter a valid email address');
            return;
        }

        // Disable form during submission
        const submitBtn = form.querySelector('.submit-btn');
        const originalBtnText = submitBtn.textContent;
        submitBtn.disabled = true;
        submitBtn.textContent = 'Joining...';

        try {
            // Save to database (update this endpoint when backend is ready)
            const response = await saveToWaitlist(email);

            if (response.success) {
                // Show success message
                form.style.display = 'none';
                successMessage.classList.add('show');

                // Track event (if you have analytics)
                trackWaitlistSignup(email);

                // Optional: Store in localStorage to prevent duplicate signups
                localStorage.setItem('greenthumb_waitlist', email);
            } else {
                throw new Error(response.message || 'Failed to join waitlist');
            }
        } catch (error) {
            console.error('Waitlist signup error:', error);
            showError('Something went wrong. Please try again.');
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
        }
    });

    // Check if user already signed up
    const existingEmail = localStorage.getItem('greenthumb_waitlist');
    if (existingEmail) {
        form.style.display = 'none';
        successMessage.classList.add('show');
    }
});

// Save to waitlist (placeholder - update when backend is ready)
async function saveToWaitlist(email) {
    // For now, save to localStorage
    // Replace this with actual API call to your backend
    const waitlistData = {
        email: email,
        timestamp: new Date().toISOString(),
        source: 'landing_page'
    };

    // Simulate API call
    return new Promise((resolve) => {
        setTimeout(() => {
            // Save to localStorage as backup
            const existingWaitlist = JSON.parse(localStorage.getItem('greenthumb_waitlist_all') || '[]');
            existingWaitlist.push(waitlistData);
            localStorage.setItem('greenthumb_waitlist_all', JSON.stringify(existingWaitlist));

            console.log('Waitlist signup:', waitlistData);
            resolve({ success: true });
        }, 1000);
    });

    // When backend is ready, use this instead:
    /*
    const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, source: 'landing_page' })
    });

    if (!response.ok) {
        throw new Error('Network response was not ok');
    }

    return await response.json();
    */
}

// Email validation
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Show error message
function showError(message) {
    // Create error element if it doesn't exist
    let errorEl = document.querySelector('.error-message');
    if (!errorEl) {
        errorEl = document.createElement('div');
        errorEl.className = 'error-message';
        errorEl.style.cssText = `
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px 20px;
            background: #ffebee;
            border: 2px solid #f44336;
            border-radius: 12px;
            color: #c62828;
            font-size: 14px;
            font-weight: 500;
            margin-top: 12px;
        `;
        document.querySelector('.waitlist-form').appendChild(errorEl);
    }

    errorEl.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <span>${message}</span>
    `;
    errorEl.style.display = 'flex';

    // Hide after 5 seconds
    setTimeout(() => {
        errorEl.style.display = 'none';
    }, 5000);
}

// Analytics tracking (optional)
function trackWaitlistSignup(email) {
    // Add your analytics tracking here
    // Example for Google Analytics:
    if (typeof gtag !== 'undefined') {
        gtag('event', 'waitlist_signup', {
            'event_category': 'engagement',
            'event_label': 'landing_page'
        });
    }

    // Example for Facebook Pixel:
    if (typeof fbq !== 'undefined') {
        fbq('track', 'Lead', {
            content_name: 'Waitlist Signup'
        });
    }

    console.log('Tracked waitlist signup for:', email);
}

// Smooth scroll for any future navigation
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Add subtle parallax effect to product cards
window.addEventListener('scroll', function() {
    const cards = document.querySelectorAll('.product-card');
    const scrolled = window.pageYOffset;

    cards.forEach((card, index) => {
        const speed = 0.05 * (index + 1);
        const yPos = -(scrolled * speed);
        card.style.transform = `translateY(${yPos}px)`;
    });
});

// Intersection Observer for fade-in animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe feature cards
document.querySelectorAll('.feature-card').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(30px)';
    card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(card);
});
