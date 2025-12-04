/**
 * ShoreSquad App
 * A modern, responsive web app for organizing beach cleanups with your crew
 */

// ===== State Management =====
const state = {
    crew: [],
    events: [],
    weather: null,
    location: null
};

// ===== DOM Elements =====
const crewList = document.getElementById('crew-list');
const eventsList = document.getElementById('events-list');
const ctaButton = document.querySelector('.cta-button');

// ===== Performance: Debounce Function =====
function debounce(fn, delay = 300) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn(...args), delay);
    };
}

// ===== Performance: Throttle Function =====
function throttle(fn, delay = 300) {
    let lastCall = 0;
    return function (...args) {
        const now = Date.now();
        if (now - lastCall >= delay) {
            lastCall = now;
            fn(...args);
        }
    };
}

// ===== Weather API Integration =====
async function fetchWeather(latitude, longitude) {
    try {
        // Using Open-Meteo API (free, no key required)
        const response = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&temperature_unit=celsius`
        );
        
        if (!response.ok) throw new Error('Weather fetch failed');
        
        const data = await response.json();
        state.weather = data.current;
        updateWeatherDisplay();
    } catch (error) {
        console.error('Error fetching weather:', error);
        displayWeatherError();
    }
}

function updateWeatherDisplay() {
    if (state.weather) {
        document.getElementById('temp').textContent = 
            `${state.weather.temperature_2m}°C`;
        document.getElementById('wind').textContent = 
            `${state.weather.wind_speed_10m} km/h`;
        document.getElementById('conditions').textContent = 
            getWeatherDescription(state.weather.weather_code);
    }
}

function displayWeatherError() {
    document.getElementById('temp').textContent = 'N/A';
    document.getElementById('wind').textContent = 'N/A';
    document.getElementById('conditions').textContent = 'Unable to load';
}

function getWeatherDescription(code) {
    const descriptions = {
        0: 'Clear',
        1: 'Mostly Clear',
        2: 'Partly Cloudy',
        3: 'Cloudy',
        45: 'Foggy',
        48: 'Foggy',
        51: 'Light Drizzle',
        61: 'Light Rain',
        71: 'Light Snow',
        80: 'Light Showers',
        95: 'Thunderstorm'
    };
    return descriptions[code] || 'Unknown';
}

// ===== Geolocation =====
function initializeLocation() {
    if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
            position => {
                state.location = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                };
                fetchWeather(state.location.latitude, state.location.longitude);
            },
            error => {
                console.log('Geolocation error:', error);
                // Default to Sydney, Australia (famous beaches)
                fetchWeather(-33.8688, 151.2093);
            }
        );
    }
}

// ===== Crew Management =====
function addCrewMember(name, role, avatar = '👤') {
    const member = {
        id: Date.now(),
        name,
        role,
        avatar,
        joinDate: new Date().toLocaleDateString()
    };
    state.crew.push(member);
    renderCrew();
    saveToLocalStorage();
}

function removeCrew(id) {
    state.crew = state.crew.filter(member => member.id !== id);
    renderCrew();
    saveToLocalStorage();
}

function renderCrew() {
    crewList.innerHTML = '';
    
    if (state.crew.length === 0) {
        crewList.innerHTML = '<p class="empty-state">No crew members yet. Start recruiting!</p>';
        return;
    }

    state.crew.forEach(member => {
        const card = createCrewCard(member);
        crewList.appendChild(card);
    });
}

function createCrewCard(member) {
    const card = document.createElement('div');
    card.className = 'crew-card';
    card.innerHTML = `
        <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">${member.avatar}</div>
        <h3>${member.name}</h3>
        <p><strong>Role:</strong> ${member.role}</p>
        <p><strong>Joined:</strong> ${member.joinDate}</p>
        <button class="remove-btn" data-id="${member.id}">Remove</button>
    `;
    
    card.querySelector('.remove-btn').addEventListener('click', () => {
        removeCrew(member.id);
    });
    
    return card;
}

// ===== Events Management =====
function addEvent(title, date, location, description) {
    const event = {
        id: Date.now(),
        title,
        date,
        location,
        description,
        participants: state.crew.length
    };
    state.events.push(event);
    renderEvents();
    saveToLocalStorage();
}

function removeEvent(id) {
    state.events = state.events.filter(event => event.id !== id);
    renderEvents();
    saveToLocalStorage();
}

function renderEvents() {
    eventsList.innerHTML = '';
    
    if (state.events.length === 0) {
        eventsList.innerHTML = '<p class="empty-state">No events scheduled yet. Plan your first cleanup!</p>';
        return;
    }

    state.events.forEach(event => {
        const card = createEventCard(event);
        eventsList.appendChild(card);
    });
}

function createEventCard(event) {
    const card = document.createElement('div');
    card.className = 'event-card';
    card.innerHTML = `
        <h3>🌊 ${event.title}</h3>
        <p><strong>Date:</strong> ${event.date}</p>
        <p><strong>Location:</strong> ${event.location}</p>
        <p>${event.description}</p>
        <p><strong>Participants:</strong> ${event.participants}</p>
        <button class="remove-btn" data-id="${event.id}">Delete</button>
    `;
    
    card.querySelector('.remove-btn').addEventListener('click', () => {
        removeEvent(event.id);
    });
    
    return card;
}

// ===== Local Storage =====
function saveToLocalStorage() {
    const data = {
        crew: state.crew,
        events: state.events
    };
    localStorage.setItem('shoresquad_data', JSON.stringify(data));
}

function loadFromLocalStorage() {
    const saved = localStorage.getItem('shoresquad_data');
    if (saved) {
        const data = JSON.parse(saved);
        state.crew = data.crew || [];
        state.events = data.events || [];
        renderCrew();
        renderEvents();
    }
}

// ===== Event Listeners & Interactivity =====
ctaButton.addEventListener('click', () => {
    // Demo: Add sample crew members
    if (state.crew.length === 0) {
        addCrewMember('Alex', 'Organizer', '🧑');
        addCrewMember('Jordan', 'Enthusiast', '👩');
        addCrewMember('Casey', 'Volunteer', '🧔');
        
        addEvent('Beach Cleanup - Pacific Shores', '2025-12-15', 'Pacific Shores Beach', 
            'Join us for a weekend cleanup! Bring gloves and bags. Coffee and snacks provided.');
        addEvent('Underwater Survey', '2025-12-22', 'Coral Bay', 
            'Scientific cleanup with ocean conservation focus.');
    }
});

// ===== Intersection Observer for Lazy Loading & Performance =====
function initializeIntersectionObserver() {
    const options = {
        threshold: 0.1,
        rootMargin: '50px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                observer.unobserve(entry.target);
            }
        });
    }, options);

    document.querySelectorAll('.section').forEach(section => {
        section.style.opacity = '0';
        section.style.transition = 'opacity 0.5s ease';
        observer.observe(section);
    });
}

// ===== Accessibility: Skip Links =====
function initializeAccessibility() {
    const mainContent = document.querySelector('main');
    if (mainContent) {
        const skipLink = document.createElement('a');
        skipLink.href = '#main-content';
        skipLink.className = 'skip-link';
        skipLink.textContent = 'Skip to main content';
        document.body.insertBefore(skipLink, document.body.firstChild);
        mainContent.id = 'main-content';
    }
}

// ===== CSS for Skip Link =====
function addAccessibilityStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .skip-link {
            position: absolute;
            top: -40px;
            left: 0;
            background: var(--accent-gold);
            color: var(--white);
            padding: 8px;
            text-decoration: none;
            z-index: 100;
        }
        .skip-link:focus {
            top: 0;
        }
        .empty-state {
            text-align: center;
            padding: 2rem;
            color: #999;
            font-style: italic;
        }
        .remove-btn {
            background: #ff6b6b;
            color: white;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 4px;
            cursor: pointer;
            margin-top: 1rem;
            transition: background 0.3s ease;
        }
        .remove-btn:hover {
            background: #ff5252;
        }
    `;
    document.head.appendChild(style);
}

// ===== Smooth Scroll on Hash Links =====
function setupSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href !== '#' && document.querySelector(href)) {
                e.preventDefault();
                document.querySelector(href).scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}

// ===== Initialization =====
document.addEventListener('DOMContentLoaded', () => {
    addAccessibilityStyles();
    initializeLocation();
    loadFromLocalStorage();
    initializeIntersectionObserver();
    initializeAccessibility();
    setupSmoothScrolling();
    
    console.log('🌊 ShoreSquad app initialized!');
});

// ===== Performance: Throttle resize events =====
window.addEventListener('resize', throttle(() => {
    console.log('Window resized');
}, 500));
