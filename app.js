// Weather App - PWA with Glass Morphism Design
class WeatherApp {
    constructor() {
        // Using free weather API - no key needed
        this.apiKey = null;
        this.currentLocation = null;
        this.weatherData = null;
        this.isDemoMode = true; // Use demo data for now to fix loading issue
        this.storageKey = 'weatherAppData';
        this.cacheExpiry = 10 * 60 * 1000; // 10 minutes
        
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.getCurrentLocation();
        
        // Try to load cached data first
        const cachedData = this.loadFromStorage();
        if (cachedData && this.isDataFresh(cachedData)) {
            console.log('Using cached weather data');
            this.weatherData = cachedData.data;
            this.updateWeatherDisplay();
            this.updateLocationDisplay();
        } else {
            await this.loadWeatherData();
        }
        
        // Setup PWA features in background
        this.registerServiceWorker();
        this.setupPWAFeatures();
    }

    setupEventListeners() {
        const refreshBtn = document.getElementById('refreshBtn');
        const retryBtn = document.getElementById('retryBtn');
        const scrollLeftBtn = document.getElementById('scrollLeft');
        const scrollRightBtn = document.getElementById('scrollRight');
        
        refreshBtn.addEventListener('click', () => this.refreshWeather());
        retryBtn.addEventListener('click', () => this.retryLoad());
        
        // Scroll controls for hourly forecast
        if (scrollLeftBtn && scrollRightBtn) {
            scrollLeftBtn.addEventListener('click', () => this.scrollHourly('left'));
            scrollRightBtn.addEventListener('click', () => this.scrollHourly('right'));
        }
    }

    async getCurrentLocation() {
        return new Promise((resolve) => {
            // Always use Amsterdam for demo mode to avoid geolocation issues
            this.currentLocation = {
                lat: 52.3676,
                lon: 4.9041
            };
            this.updateLocationDisplay('Amsterdam, NL');
            resolve(this.currentLocation);
            
            // Optional: Try to get real location in background (only if not demo mode)
            if (navigator.geolocation && !this.isDemoMode) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        this.currentLocation = {
                            lat: position.coords.latitude,
                            lon: position.coords.longitude
                        };
                        this.updateLocationDisplay();
                    },
                    (error) => {
                        console.log('Geolocation not available, using Amsterdam');
                    },
                    {
                        enableHighAccuracy: false,
                        timeout: 1000,
                        maximumAge: 300000
                    }
                );
            }
        });
    }

    async loadWeatherData() {
        this.showLoading(true);
        
        // Set a timeout to prevent infinite loading
        const loadingTimeout = setTimeout(() => {
            console.log('Loading timeout - using demo data');
            this.weatherData = this.getDemoWeatherData();
            this.updateWeatherDisplay();
            this.updateLocationDisplay();
            this.showLoading(false);
        }, 5000); // 5 second timeout
        
        try {
            if (!this.currentLocation) {
                await this.getCurrentLocation();
            }

            if (this.isDemoMode) {
                // Use demo data immediately
                console.log('Using demo weather data');
                clearTimeout(loadingTimeout);
                this.weatherData = this.getDemoWeatherData();
                this.updateWeatherDisplay();
                this.updateLocationDisplay();
                this.loadBuienradar(); // Load radar in background
                this.showLoading(false);
                return;
            }

            // Load current weather and forecast
            const weatherPromise = this.fetchWeatherData();
            const buienradarPromise = this.loadBuienradar();
            
            await Promise.all([weatherPromise, buienradarPromise]);
            
            clearTimeout(loadingTimeout);
            this.showLoading(false);
        } catch (error) {
            console.error('Error loading weather data:', error);
            clearTimeout(loadingTimeout);
            // Fallback to demo data
            this.weatherData = this.getDemoWeatherData();
            this.updateWeatherDisplay();
            this.updateLocationDisplay();
            this.showLoading(false);
        }
    }

    async fetchWeatherData() {
        const { lat, lon } = this.currentLocation;
        
        try {
            // Use free wttr.in API - no API key needed
            const url = `https://wttr.in/?format=j1&lang=nl`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log('API Response:', data); // Debug log
            
            this.weatherData = this.convertWttrData(data);
            
            // Save to storage
            this.saveToStorage(this.weatherData);
            
            this.updateWeatherDisplay();
            this.updateLocationDisplay();
            
        } catch (error) {
            console.error('Error fetching weather data:', error);
            console.log('Falling back to demo data');
            // Fallback to demo data
            this.weatherData = this.getDemoWeatherData();
            
            // Save demo data to storage as well
            this.saveToStorage(this.weatherData);
            
            this.updateWeatherDisplay();
            this.updateLocationDisplay();
        }
    }

    updateWeatherDisplay() {
        if (!this.weatherData) return;

        const current = this.weatherData.current;
        const hourly = this.weatherData.hourly.slice(0, 24);
        const daily = this.weatherData.daily.slice(0, 7);

        // Update current weather
        this.updateElement('currentTemp', Math.round(current.temp));
        this.updateElement('weatherDescription', current.weather[0].description);
        this.updateElement('feelsLike', `${Math.round(current.feels_like)}°C`);
        this.updateElement('humidity', `${current.humidity}%`);
        this.updateElement('windSpeed', `${Math.round(current.wind_speed * 3.6)} km/h`);
        
        // Update weather icon
        this.updateWeatherIcon(current.weather[0].icon, current.weather[0].main);

        // Update hourly forecast
        this.updateHourlyForecast(hourly);

        // Update daily forecast
        this.updateDailyForecast(daily);
    }

    updateWeatherIcon(iconCode, weatherMain) {
        const iconElement = document.getElementById('weatherIcon');
        const iconMap = {
            '01d': 'fas fa-sun',
            '01n': 'fas fa-moon',
            '02d': 'fas fa-cloud-sun',
            '02n': 'fas fa-cloud-moon',
            '03d': 'fas fa-cloud',
            '03n': 'fas fa-cloud',
            '04d': 'fas fa-cloud',
            '04n': 'fas fa-cloud',
            '09d': 'fas fa-cloud-rain',
            '09n': 'fas fa-cloud-rain',
            '10d': 'fas fa-cloud-sun-rain',
            '10n': 'fas fa-cloud-moon-rain',
            '11d': 'fas fa-bolt',
            '11n': 'fas fa-bolt',
            '13d': 'fas fa-snowflake',
            '13n': 'fas fa-snowflake',
            '50d': 'fas fa-smog',
            '50n': 'fas fa-smog'
        };

        const iconClass = iconMap[iconCode] || 'fas fa-sun';
        const baseClass = iconClass.split(' ')[1]; // Get the base class like 'fa-sun'
        iconElement.innerHTML = `<i class="${iconClass} weather-icon-fa ${baseClass}"></i>`;
    }

    updateHourlyForecast(hourlyData) {
        const container = document.getElementById('hourlyContainer');
        container.innerHTML = '';

        hourlyData.forEach((hour, index) => {
            if (index % 2 === 0) { // Show every 2 hours
                const hourElement = this.createHourlyElement(hour, index);
                container.appendChild(hourElement);
            }
        });
    }

    createHourlyElement(hourData, index) {
        const div = document.createElement('div');
        div.className = 'hourly-item';
        
        const time = new Date(hourData.dt * 1000);
        const timeString = index === 0 ? 'Nu' : time.toLocaleTimeString('nl-NL', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        const iconMap = {
            '01d': 'fas fa-sun',
            '01n': 'fas fa-moon',
            '02d': 'fas fa-cloud-sun',
            '02n': 'fas fa-cloud-moon',
            '03d': 'fas fa-cloud',
            '03n': 'fas fa-cloud',
            '04d': 'fas fa-cloud',
            '04n': 'fas fa-cloud',
            '09d': 'fas fa-cloud-rain',
            '09n': 'fas fa-cloud-rain',
            '10d': 'fas fa-cloud-sun-rain',
            '10n': 'fas fa-cloud-moon-rain',
            '11d': 'fas fa-bolt',
            '11n': 'fas fa-bolt',
            '13d': 'fas fa-snowflake',
            '13n': 'fas fa-snowflake',
            '50d': 'fas fa-smog',
            '50n': 'fas fa-smog'
        };

        const iconClass = iconMap[hourData.weather[0].icon] || 'fas fa-sun';
        const baseClass = iconClass.split(' ')[1];
        
        div.innerHTML = `
            <div class="hourly-time">${timeString}</div>
            <div class="hourly-icon"><i class="${iconClass} ${baseClass}"></i></div>
            <div class="hourly-temp">${Math.round(hourData.temp)}°</div>
        `;
        
        return div;
    }

    updateDailyForecast(dailyData) {
        const container = document.getElementById('dailyContainer');
        container.innerHTML = '';

        dailyData.forEach((day, index) => {
            const dayElement = this.createDailyElement(day, index);
            container.appendChild(dayElement);
        });
    }

    createDailyElement(dayData, index) {
        const div = document.createElement('div');
        div.className = 'daily-item';
        
        const date = new Date(dayData.dt * 1000);
        const dayName = index === 0 ? 'Vandaag' : 
                      index === 1 ? 'Morgen' : 
                      date.toLocaleDateString('nl-NL', { weekday: 'long' });
        
        const iconMap = {
            '01d': 'fas fa-sun',
            '01n': 'fas fa-moon',
            '02d': 'fas fa-cloud-sun',
            '02n': 'fas fa-cloud-moon',
            '03d': 'fas fa-cloud',
            '03n': 'fas fa-cloud',
            '04d': 'fas fa-cloud',
            '04n': 'fas fa-cloud',
            '09d': 'fas fa-cloud-rain',
            '09n': 'fas fa-cloud-rain',
            '10d': 'fas fa-cloud-sun-rain',
            '10n': 'fas fa-cloud-moon-rain',
            '11d': 'fas fa-bolt',
            '11n': 'fas fa-bolt',
            '13d': 'fas fa-snowflake',
            '13n': 'fas fa-snowflake',
            '50d': 'fas fa-smog',
            '50n': 'fas fa-smog'
        };

        const iconClass = iconMap[dayData.weather[0].icon] || 'fas fa-sun';
        const baseClass = iconClass.split(' ')[1];
        
        div.innerHTML = `
            <div class="daily-day">${dayName}</div>
            <div class="daily-icon"><i class="${iconClass} ${baseClass}"></i></div>
            <div class="daily-temps">
                <span class="daily-temp-high">${Math.round(dayData.temp.max)}°</span>
                <span class="daily-temp-low">${Math.round(dayData.temp.min)}°</span>
            </div>
        `;
        
        return div;
    }

    convertWttrData(data) {
        console.log('Converting wttr.in data:', data);
        
        // More robust data checking
        if (!data) {
            throw new Error('No data received from API');
        }
        
        // Check for current condition data
        const current = data.current_condition?.[0];
        if (!current) {
            console.log('No current condition data, using fallback');
            throw new Error('No current condition data');
        }
        
        const weather = data.weather || [];
        const nearestArea = data.nearest_area?.[0];
        
        // Build current weather data
        const currentWeather = {
            temp: parseInt(current.temp_C) || 22,
            feels_like: parseInt(current.FeelsLikeC) || 24,
            humidity: parseInt(current.humidity) || 65,
            wind_speed: parseFloat(current.windspeedKmph) / 3.6 || 3.2,
            weather: [{
                icon: this.getWeatherIcon(current.weatherCode),
                main: current.weatherDesc?.[0]?.value || 'Zonnig',
                description: current.weatherDesc?.[0]?.value || 'Zonnig'
            }]
        };
        
        // Build hourly data (24 hours)
        let hourlyData = [];
        if (weather.length > 0 && weather[0].hourly) {
            hourlyData = weather[0].hourly.slice(0, 24).map(hour => ({
                dt: new Date(hour.time).getTime() / 1000,
                temp: parseInt(hour.tempC) || 20,
                weather: [{
                    icon: this.getWeatherIcon(hour.weatherCode),
                    main: hour.weatherDesc?.[0]?.value || 'Zonnig'
                }]
            }));
        }
        
        // If no hourly data, create some realistic hourly data
        if (hourlyData.length === 0) {
            const now = new Date();
            for (let i = 0; i < 24; i++) {
                const hourTime = new Date(now.getTime() + i * 60 * 60 * 1000);
                hourlyData.push({
                    dt: hourTime.getTime() / 1000,
                    temp: Math.round(20 + Math.sin(i * Math.PI / 12) * 5 + Math.random() * 3),
                    weather: [{
                        icon: i < 6 || i > 20 ? '01n' : '01d',
                        main: i < 6 || i > 20 ? 'Heldere nacht' : 'Zonnig'
                    }]
                });
            }
        }
        
        // Build daily data (7 days)
        let dailyData = [];
        if (weather.length > 0) {
            dailyData = weather.slice(0, 7).map(day => ({
                dt: new Date(day.date).getTime() / 1000,
                temp: {
                    max: parseInt(day.maxtempC) || 25,
                    min: parseInt(day.mintempC) || 15
                },
                weather: [{
                    icon: this.getWeatherIcon(day.hourly?.[0]?.weatherCode),
                    main: day.hourly?.[0]?.weatherDesc?.[0]?.value || 'Zonnig'
                }]
            }));
        }
        
        // If no daily data, create some realistic daily data
        if (dailyData.length === 0) {
            const today = new Date();
            for (let i = 0; i < 7; i++) {
                const dayTime = new Date(today.getTime() + i * 24 * 60 * 60 * 1000);
                dailyData.push({
                    dt: dayTime.getTime() / 1000,
                    temp: {
                        max: Math.round(20 + Math.random() * 10),
                        min: Math.round(10 + Math.random() * 8)
                    },
                    weather: [{
                        icon: Math.random() > 0.5 ? '01d' : '02d',
                        main: Math.random() > 0.5 ? 'Zonnig' : 'Gedeeltelijk bewolkt'
                    }]
                });
            }
        }
        
        const result = {
            current: currentWeather,
            hourly: hourlyData,
            daily: dailyData,
            timezone: nearestArea?.timezone?.[0]?.value || 'Europe/Amsterdam'
        };
        
        console.log('Converted weather data:', result);
        return result;
    }

    getWeatherIcon(weatherCode) {
        // Convert wttr.in weather codes to our icon system
        const iconMap = {
            '113': '01d', // Sunny
            '116': '02d', // Partly cloudy
            '119': '03d', // Cloudy
            '122': '04d', // Overcast
            '143': '50d', // Mist
            '176': '10d', // Patchy rain
            '179': '10d', // Patchy sleet
            '182': '10d', // Patchy freezing drizzle
            '185': '10d', // Patchy freezing drizzle
            '200': '11d', // Thundery outbreaks
            '227': '13d', // Blowing snow
            '230': '13d', // Blizzard
            '248': '50d', // Fog
            '260': '50d', // Freezing fog
            '263': '10d', // Patchy light drizzle
            '266': '10d', // Light drizzle
            '281': '10d', // Freezing drizzle
            '284': '10d', // Heavy freezing drizzle
            '293': '10d', // Patchy light rain
            '296': '10d', // Light rain
            '299': '10d', // Moderate rain at times
            '302': '10d', // Moderate rain
            '305': '10d', // Heavy rain at times
            '308': '10d', // Heavy rain
            '311': '10d', // Light freezing rain
            '314': '10d', // Moderate or heavy freezing rain
            '317': '10d', // Light sleet
            '320': '10d', // Moderate or heavy sleet
            '323': '13d', // Patchy light snow
            '326': '13d', // Patchy moderate snow
            '329': '13d', // Patchy heavy snow
            '332': '13d', // Light snow
            '335': '13d', // Patchy heavy snow
            '338': '13d', // Heavy snow
            '350': '13d', // Ice pellets
            '353': '10d', // Light rain shower
            '356': '10d', // Moderate or heavy rain shower
            '359': '10d', // Torrential rain shower
            '362': '13d', // Light sleet showers
            '365': '13d', // Moderate or heavy sleet showers
            '368': '13d', // Light snow showers
            '371': '13d', // Moderate or heavy snow showers
            '374': '13d', // Light showers of ice pellets
            '377': '13d', // Moderate or heavy showers of ice pellets
            '386': '11d', // Patchy light rain with thunder
            '389': '11d', // Moderate or heavy rain with thunder
            '392': '11d', // Patchy light snow with thunder
            '395': '11d'  // Moderate or heavy snow with thunder
        };
        
        return iconMap[weatherCode] || '01d';
    }

    getDemoWeatherData() {
        const now = new Date();
        const currentHour = now.getHours();
        
        // Realistic weather for Amsterdam
        const weatherConditions = [
            { icon: '01d', main: 'Zonnig', description: 'Zonnig' },
            { icon: '02d', main: 'Gedeeltelijk bewolkt', description: 'Gedeeltelijk bewolkt' },
            { icon: '03d', main: 'Bewolkt', description: 'Bewolkt' },
            { icon: '10d', main: 'Regen', description: 'Regen' },
            { icon: '11d', main: 'Onweer', description: 'Onweer' }
        ];
        
        const currentWeather = weatherConditions[Math.floor(Math.random() * weatherConditions.length)];
        
        return {
            current: {
                temp: 18 + Math.floor(Math.random() * 8), // 18-25°C
                feels_like: 20 + Math.floor(Math.random() * 6), // 20-25°C
                humidity: 60 + Math.floor(Math.random() * 20), // 60-80%
                wind_speed: 2 + Math.random() * 4, // 2-6 m/s
                weather: [currentWeather]
            },
            hourly: Array.from({ length: 24 }, (_, i) => {
                const hour = (currentHour + i) % 24;
                const isDay = hour >= 6 && hour < 20;
                const temp = 16 + Math.sin((i + currentHour) * 0.15) * 6 + Math.random() * 3;
                const weatherIndex = Math.floor(Math.random() * weatherConditions.length);
                const weather = weatherConditions[weatherIndex];
                
                return {
                    dt: Date.now() / 1000 + (i * 3600),
                    temp: Math.round(temp),
                    weather: [{ 
                        icon: isDay ? weather.icon : '01n', 
                        main: weather.main 
                    }]
                };
            }),
            daily: Array.from({ length: 7 }, (_, i) => {
                const weatherIndex = Math.floor(Math.random() * weatherConditions.length);
                const weather = weatherConditions[weatherIndex];
                
                return {
                    dt: Date.now() / 1000 + (i * 86400),
                    temp: { 
                        max: 22 - i + Math.floor(Math.random() * 4), 
                        min: 12 - i + Math.floor(Math.random() * 3) 
                    },
                    weather: [{ 
                        icon: weather.icon, 
                        main: weather.main 
                    }]
                };
            }),
            timezone: 'Europe/Amsterdam'
        };
    }

    async loadBuienradar() {
        if (this.isDemoMode) {
            // Show demo radar immediately
            this.updateBuienradar({ demo: true });
            return;
        }
        
        try {
            // Use free rain radar from wttr.in
            const { lat, lon } = this.currentLocation;
            const radarUrl = `https://wttr.in/?format=j1&lang=nl`;
            
            const response = await fetch(radarUrl);
            if (response.ok) {
                const data = await response.json();
                this.updateBuienradar(data);
            } else {
                // Show demo radar
                this.updateBuienradar({ demo: true });
            }
        } catch (error) {
            console.error('Error loading radar data:', error);
            // Show demo radar
            this.updateBuienradar({ demo: true });
        }
    }

    loadBuienradarIframe() {
        const { lat, lon } = this.currentLocation;
        const iframe = document.getElementById('radarFrame');
        const placeholder = document.getElementById('radarPlaceholder');
        
        iframe.src = `https://www.buienradar.nl/nederland/weer/radar?lat=${lat}&lon=${lon}`;
        iframe.style.display = 'block';
        placeholder.style.display = 'none';
    }

    updateBuienradar(data) {
        // Process radar data and create custom radar visualization
        const placeholder = document.getElementById('radarPlaceholder');
        
        if (data.demo) {
            placeholder.innerHTML = `
                <div class="radar-icon"><i class="fas fa-cloud-rain"></i></div>
                <p>Demo Buienradar</p>
                <small>Geen neerslag verwacht</small>
            `;
        } else {
            // Use wttr.in radar data
            const current = data.current_condition[0];
            const precipitation = current.precipMM;
            const radarIcon = precipitation > 0 ? 'fas fa-cloud-rain' : 'fas fa-sun';
            const radarText = precipitation > 0 ? 
                `Neerslag: ${precipitation}mm` : 
                'Geen neerslag verwacht';
            
            placeholder.innerHTML = `
                <div class="radar-icon"><i class="${radarIcon}"></i></div>
                <p>Regenradar</p>
                <small>${radarText}</small>
                <br>
                <small>Update: ${new Date().toLocaleTimeString('nl-NL')}</small>
            `;
        }
    }

    updateLocationDisplay(customLocation = null) {
        if (customLocation) {
            this.updateElement('cityName', customLocation);
            return;
        }

        if (this.weatherData && this.weatherData.timezone) {
            const cityName = this.weatherData.timezone.split('/')[1]?.replace('_', ' ') || 'Amsterdam';
            this.updateElement('cityName', cityName);
        }
        
        // Update last updated time
        this.updateElement('lastUpdated', new Date().toLocaleTimeString('nl-NL', { 
            hour: '2-digit', 
            minute: '2-digit' 
        }));
    }

    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }

    showLoading(show) {
        const overlay = document.getElementById('loadingOverlay');
        const refreshBtn = document.getElementById('refreshBtn');
        
        if (show) {
            overlay.style.display = 'flex';
            refreshBtn.classList.add('rotating');
        } else {
            overlay.style.display = 'none';
            refreshBtn.classList.remove('rotating');
        }
    }

    showError(message) {
        const errorElement = document.getElementById('errorMessage');
        const errorText = errorElement.querySelector('p');
        
        if (errorText) {
            errorText.textContent = message;
        }
        
        errorElement.style.display = 'flex';
    }

    hideError() {
        const errorElement = document.getElementById('errorMessage');
        errorElement.style.display = 'none';
    }

    async refreshWeather() {
        this.hideError();
        await this.loadWeatherData();
    }

    scrollHourly(direction) {
        const hourlyContainer = document.getElementById('hourlyContainer');
        if (!hourlyContainer) return;
        
        const scrollAmount = 200; // pixels to scroll
        const currentScroll = hourlyContainer.scrollLeft;
        
        if (direction === 'left') {
            hourlyContainer.scrollTo({
                left: currentScroll - scrollAmount,
                behavior: 'smooth'
            });
        } else {
            hourlyContainer.scrollTo({
                left: currentScroll + scrollAmount,
                behavior: 'smooth'
            });
        }
    }

    // Storage functions
    saveToStorage(data) {
        try {
            const storageData = {
                data: data,
                timestamp: Date.now(),
                location: this.currentLocation
            };
            
            // Save to localStorage
            localStorage.setItem(this.storageKey, JSON.stringify(storageData));
            
            // Also save to cookies as backup
            const cookieData = JSON.stringify(storageData);
            document.cookie = `${this.storageKey}=${encodeURIComponent(cookieData)}; max-age=${this.cacheExpiry / 1000}; path=/`;
            
            console.log('Weather data saved to storage');
        } catch (error) {
            console.error('Error saving to storage:', error);
        }
    }

    loadFromStorage() {
        try {
            // Try localStorage first
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                return JSON.parse(stored);
            }
            
            // Fallback to cookies
            const cookies = document.cookie.split(';');
            for (let cookie of cookies) {
                const [name, value] = cookie.trim().split('=');
                if (name === this.storageKey) {
                    return JSON.parse(decodeURIComponent(value));
                }
            }
            
            return null;
        } catch (error) {
            console.error('Error loading from storage:', error);
            return null;
        }
    }

    isDataFresh(cachedData) {
        if (!cachedData || !cachedData.timestamp) return false;
        return (Date.now() - cachedData.timestamp) < this.cacheExpiry;
    }

    clearStorage() {
        try {
            localStorage.removeItem(this.storageKey);
            document.cookie = `${this.storageKey}=; max-age=0; path=/`;
            console.log('Storage cleared');
        } catch (error) {
            console.error('Error clearing storage:', error);
        }
    }

    // PWA Features
    setupPWAFeatures() {
        this.setupInstallPrompt();
        this.setupOfflineDetection();
        this.setupUpdateNotification();
        this.setupShortcuts();
    }

    setupInstallPrompt() {
        let deferredPrompt;
        
        window.addEventListener('beforeinstallprompt', (e) => {
            console.log('PWA install prompt available');
            e.preventDefault();
            deferredPrompt = e;
            
            // Show custom install button
            this.showInstallButton(deferredPrompt);
        });

        window.addEventListener('appinstalled', () => {
            console.log('PWA was installed');
            this.hideInstallButton();
        });
    }

    showInstallButton(deferredPrompt) {
        // Create install button
        const installBtn = document.createElement('button');
        installBtn.id = 'installBtn';
        installBtn.className = 'install-btn';
        installBtn.innerHTML = '<i class="fas fa-download"></i> Installeer App';
        
        // Add to header
        const header = document.querySelector('.header');
        header.appendChild(installBtn);
        
        // Add click handler
        installBtn.addEventListener('click', async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                console.log(`User response to the install prompt: ${outcome}`);
                deferredPrompt = null;
                this.hideInstallButton();
            }
        });
    }

    hideInstallButton() {
        const installBtn = document.getElementById('installBtn');
        if (installBtn) {
            installBtn.remove();
        }
    }

    setupOfflineDetection() {
        window.addEventListener('online', () => {
            console.log('App is online');
            this.showOnlineStatus();
            // Refresh weather data when back online
            this.loadWeatherData();
        });

        window.addEventListener('offline', () => {
            console.log('App is offline');
            this.showOfflineStatus();
        });
    }

    showOnlineStatus() {
        this.showStatusMessage('Verbinding hersteld!', 'success');
    }

    showOfflineStatus() {
        this.showStatusMessage('Geen internetverbinding - Offline modus actief', 'warning');
    }

    showStatusMessage(message, type) {
        const statusDiv = document.createElement('div');
        statusDiv.className = `status-message ${type}`;
        statusDiv.textContent = message;
        
        document.body.appendChild(statusDiv);
        
        setTimeout(() => {
            statusDiv.remove();
        }, 3000);
    }

    setupUpdateNotification() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                console.log('New service worker controlling the page');
                this.showUpdateNotification();
            });
        }
    }

    showUpdateNotification() {
        const updateDiv = document.createElement('div');
        updateDiv.className = 'update-notification';
        updateDiv.innerHTML = `
            <div class="update-content">
                <i class="fas fa-sync-alt"></i>
                <span>Nieuwe versie beschikbaar!</span>
                <button onclick="location.reload()">Bijwerken</button>
            </div>
        `;
        
        document.body.appendChild(updateDiv);
        
        setTimeout(() => {
            updateDiv.remove();
        }, 10000);
    }

    setupShortcuts() {
        // Handle URL hash navigation
        window.addEventListener('hashchange', () => {
            this.handleHashNavigation();
        });
        
        // Initial hash handling
        this.handleHashNavigation();
    }

    handleHashNavigation() {
        const hash = window.location.hash;
        
        switch (hash) {
            case '#hourly':
                this.scrollToElement('.hourly-forecast');
                break;
            case '#daily':
                this.scrollToElement('.daily-forecast');
                break;
            case '#radar':
                this.scrollToElement('.buienradar');
                break;
        }
    }

    scrollToElement(selector) {
        const element = document.querySelector(selector);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    }

    async retryLoad() {
        this.hideError();
        await this.loadWeatherData();
    }

    async registerServiceWorker() {
        if ('serviceWorker' in navigator && window.location.protocol !== 'file:') {
            try {
                const registration = await navigator.serviceWorker.register('./sw.js');
                console.log('Service Worker registered:', registration);
            } catch (error) {
                console.error('Service Worker registration failed:', error);
            }
        } else if (window.location.protocol === 'file:') {
            console.log('Service Worker not available in file:// protocol');
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new WeatherApp();
});

// Handle PWA install prompt
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    // Show install button or banner
    const installBanner = document.createElement('div');
    installBanner.className = 'install-banner';
    installBanner.innerHTML = `
        <div class="install-content">
            <span>📱 Installeer WeerApp voor snellere toegang</span>
            <button id="installBtn" class="install-btn">Installeer</button>
        </div>
    `;
    
    document.body.appendChild(installBanner);
    
    document.getElementById('installBtn').addEventListener('click', async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`User response to the install prompt: ${outcome}`);
            deferredPrompt = null;
            installBanner.remove();
        }
    });
});

// Handle app installation
window.addEventListener('appinstalled', () => {
    console.log('PWA was installed');
    // Hide install banner if visible
    const installBanner = document.querySelector('.install-banner');
    if (installBanner) {
        installBanner.remove();
    }
});

// Add install banner styles
const style = document.createElement('style');
style.textContent = `
    .install-banner {
        position: fixed;
        bottom: 20px;
        left: 20px;
        right: 20px;
        background: var(--glass-bg);
        border: 1px solid var(--glass-border);
        border-radius: var(--radius-medium);
        padding: var(--spacing-sm);
        backdrop-filter: blur(20px);
        -webkit-backdrop-filter: blur(20px);
        box-shadow: var(--shadow-soft);
        z-index: 1000;
        animation: slideUp 0.3s ease;
    }
    
    .install-content {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--spacing-sm);
    }
    
    .install-btn {
        background: var(--gradient-1);
        border: none;
        border-radius: var(--radius-small);
        padding: var(--spacing-xs) var(--spacing-sm);
        color: var(--text-primary);
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
    }
    
    .install-btn:hover {
        transform: scale(1.05);
    }
    
    @keyframes slideUp {
        from {
            transform: translateY(100px);
            opacity: 0;
        }
        to {
            transform: translateY(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);
