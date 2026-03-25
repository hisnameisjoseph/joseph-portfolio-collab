// Joseph Ho Portfolio - Interactions

document.addEventListener('DOMContentLoaded', () => {
    
    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
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

    // Navbar background on scroll
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.style.background = 'rgba(10, 10, 15, 0.95)';
        } else {
            navbar.style.background = 'rgba(10, 10, 15, 0.85)';
        }
    });

    // Add fade-in animation on scroll
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
            }
        });
    }, observerOptions);

    // Observe elements for animation
    document.querySelectorAll('.skill-category, .cert-card, .timeline-item, .project-card, .education-card').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });

    // Add fade-in class styles dynamically
    const style = document.createElement('style');
    style.textContent = `
        .fade-in {
            opacity: 1 !important;
            transform: translateY(0) !important;
        }
    `;
    document.head.appendChild(style);

    // Typing effect for hero subtitle (optional enhancement)
    const heroSubtitle = document.querySelector('.hero h2');
    if (heroSubtitle) {
        const text = heroSubtitle.textContent;
        heroSubtitle.textContent = '';
        let i = 0;
        
        const typeInterval = setInterval(() => {
            if (i < text.length) {
                heroSubtitle.textContent += text.charAt(i);
                i++;
            } else {
                clearInterval(typeInterval);
            }
        }, 50);
    }

    const latestActivityData = null; // STRAVA_PLACEHOLDER

    async function renderLatestActivity(activity) {
        const container = document.getElementById('strava-latest');
        if (!container) return;

        if (!activity || activity.error) {
            container.innerHTML = `<p>Unable to load Strava activity data.</p><p>${activity?.error ?? 'No data'}</p>`;
            return;
        }

        const distanceKm = (activity.distance / 1000).toFixed(2);
        const movingTime = new Date(activity.moving_time * 1000).toISOString().substr(11, 8);
        const paceMins = activity.average_speed > 0 ? ((1000 / activity.average_speed) / 60).toFixed(2) : 'N/A';
        const startLocal = new Date(activity.start_date_local).toLocaleString();

        container.innerHTML = `
            <h4>${activity.name}</h4>
            <p><strong>Type:</strong> ${activity.type}</p>
            <p><strong>Date:</strong> ${startLocal}</p>
            <p><strong>Distance:</strong> ${distanceKm} km</p>
            <p><strong>Moving Time:</strong> ${movingTime}</p>
            <p><strong>Avg Speed:</strong> ${(activity.average_speed * 3.6).toFixed(2)} km/h</p>
            <p><strong>Avg Pace:</strong> ${paceMins} min/km</p>
            ${activity.total_elevation_gain ? `<p><strong>Elevation gain:</strong> ${activity.total_elevation_gain.toFixed(1)} m</p>` : ''}
            <p><strong>Link:</strong> <a href="https://www.strava.com/activities/${activity.id}" target="_blank" rel="noopener noreferrer">View on Strava</a></p>
        `;
    }

    function loadStravaLatest() {
        if (!latestActivityData) {
            renderLatestActivity({ error: 'Strava data not available. Check build process.' });
            return;
        }
        renderLatestActivity(latestActivityData);
    }

    loadStravaLatest();

    console.log('🎯 Joseph Ho Portfolio loaded');
});
