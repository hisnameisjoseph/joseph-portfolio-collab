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
    const specificActivitiesData = null; // SPECIFIC_ACTIVITIES_PLACEHOLDER

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

    async function renderRunningGrid(activities) {
        const container = document.querySelector('.running-grid');
        if (!container || !activities || activities.length === 0) return;

        container.innerHTML = activities.map(activity => {
            const distanceKm = (activity.distance / 1000).toFixed(2);
            const movingTime = new Date(activity.moving_time * 1000).toISOString().substr(11, 8);
            const paceMins = activity.average_speed > 0 ? ((1000 / activity.average_speed) / 60).toFixed(2) : 'N/A';
            const startLocal = new Date(activity.start_date_local).toLocaleDateString();

            return `
                <article class="activity-card">
                    <h3>${activity.name}</h3>
                    <p class="activity-date">${startLocal}</p>
                    <div class="activity-stats">
                        <p><strong>Distance:</strong> ${distanceKm} km</p>
                        <p><strong>Time:</strong> ${movingTime}</p>
                        <p><strong>Pace:</strong> ${paceMins} min/km</p>
                        ${activity.total_elevation_gain ? `<p><strong>Elevation:</strong> ${activity.total_elevation_gain.toFixed(1)} m</p>` : ''}
                    </div>
                    <div class="activity-map" id="map-${activity.id}" style="height: 200px; margin: 10px 0;"></div>
                    <a href="https://www.strava.com/activities/${activity.id}" target="_blank" class="activity-link">View on Strava →</a>
                </article>
            `;
        }).join('');

        // Load Leaflet and render maps
        if (typeof L === 'undefined') {
            const leafletCSS = document.createElement('link');
            leafletCSS.rel = 'stylesheet';
            leafletCSS.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
            document.head.appendChild(leafletCSS);

            const leafletJS = document.createElement('script');
            leafletJS.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
            leafletJS.onload = () => renderMaps(activities);
            document.head.appendChild(leafletJS);
        } else {
            renderMaps(activities);
        }
    }

    function renderMaps(activities) {
        activities.forEach(activity => {
            const mapContainer = document.getElementById(`map-${activity.id}`);
            if (!mapContainer || !activity.map || !activity.map.summary_polyline) return;

            const map = L.map(mapContainer).setView([0, 0], 13);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(map);

            // Decode polyline (simplified version)
            const path = decodePolyline(activity.map.summary_polyline);
            const latLngs = path.map(p => [p.lat, p.lng]);

            if (latLngs.length > 0) {
                const polyline = L.polyline(latLngs, {
                    color: '#FF6B35',
                    weight: 3,
                    opacity: 0.8
                }).addTo(map);

                map.fitBounds(polyline.getBounds());

                // Add start marker
                L.circleMarker(latLngs[0], {
                    radius: 6,
                    fillColor: '#00FF00',
                    color: '#000',
                    weight: 2,
                    opacity: 1,
                    fillOpacity: 0.8
                }).bindPopup('Start').addTo(map);

                // Add end marker
                L.circleMarker(latLngs[latLngs.length - 1], {
                    radius: 6,
                    fillColor: '#FF0000',
                    color: '#000',
                    weight: 2,
                    opacity: 1,
                    fillOpacity: 0.8
                }).bindPopup('Finish').addTo(map);
            }
        });
    }

    function decodePolyline(encoded) {
        const poly = [];
        let index = 0, lat = 0, lng = 0;

        while (index < encoded.length) {
            let result = 0, shift = 0;
            let b;
            do {
                b = encoded.charCodeAt(index++) - 63;
                result |= (b & 0x1f) << shift;
                shift += 5;
            } while (b >= 0x20);

            const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
            lat += dlat;

            result = 0;
            shift = 0;
            do {
                b = encoded.charCodeAt(index++) - 63;
                result |= (b & 0x1f) << shift;
                shift += 5;
            } while (b >= 0x20);

            const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
            lng += dlng;

            poly.push({
                lat: lat / 1e5,
                lng: lng / 1e5
            });
        }
        return poly;
    }

    function loadRunningGrid() {
        if (!specificActivitiesData || specificActivitiesData.length === 0) {
            console.log('No specific activities data available');
            return;
        }
        renderRunningGrid(specificActivitiesData);
    }

    function loadStravaLatest() {
        if (!latestActivityData) {
            renderLatestActivity({ error: 'Strava data not available. Check build process.' });
            return;
        }
        renderLatestActivity(latestActivityData);
    }

    loadStravaLatest();
    loadRunningGrid();

    console.log('🎯 Joseph Ho Portfolio loaded');
});
