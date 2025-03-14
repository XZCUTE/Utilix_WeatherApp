const API_key = "00a93aac90f5d399e148ad3fd2d77326";
const OpenUV_API_key = "openuv-1jsc4rm78tteqt-io";
const WeatherAPI_key = "0a90e6a901444ca1b2590818251702";

const CHART_OPTIONS = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
        x: {
            grid: { display: false },
            ticks: { color: '#9CA3AF' }
        },
        y: {
            grid: { borderDash: [2] },
            ticks: { color: '#9CA3AF' }
        }
    },
    plugins: {
        legend: { display: false }
    }
};

const HOURLY_SEGMENTS = {
    MORNING: { start: 6, end: 11, label: 'Morning' },
    AFTERNOON: { start: 12, end: 17, label: 'Afternoon' },
    EVENING: { start: 18, end: 21, label: 'Evening' },
    NIGHT: { start: 22, end: 5, label: 'Night' }
};

function fetchWeather(cityOrZip) {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${cityOrZip}&appid=${API_key}&units=metric`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
                // Store coordinates for later use
                localStorage.setItem('lat', data.coord.lat);
                localStorage.setItem('lon', data.coord.lon);
                
            document.getElementById('location').innerText = data.name + ", " + data.sys.country;
            document.getElementById('current-temperature').innerText = data.main.temp + "°C";
            document.getElementById('temperature').innerText = data.main.temp + "°C";
            document.getElementById('weather-description').innerText = data.weather[0].description;
            document.getElementById('pressure-value').innerText = data.main.pressure + " mb";
            document.getElementById('visibility-value').innerText = (data.visibility / 1000) + " km";
            document.getElementById('humidity-value').innerText = data.main.humidity + "%";
            document.getElementById('wind').innerText = data.wind.speed + " m/s";
            document.getElementById('sunset').innerText = new Date(data.sys.sunset * 1000).toLocaleTimeString();
            document.getElementById('sunrise').innerText = new Date(data.sys.sunrise * 1000).toLocaleTimeString();
            document.getElementById('weather-icon').src = `http://openweathermap.org/img/wn/${data.weather[0].icon}.png`;

            // Fetch UVI data
            fetchUVI(data.coord.lat, data.coord.lon);

            // Fetch 5-day forecast data
            fetchForecast(data.coord.lat, data.coord.lon);

            // Fetch AQI data
                fetchAQI(data.coord.lat, data.coord.lon);

                // Fetch hourly temperature data
                fetchHourlyTemperature(data.coord.lat, data.coord.lon);
        });
}

function fetchUVI(lat, lon) {
        const url = `https://currentuvindex.com/api/v1/uvi?latitude=${lat}&longitude=${lon}`;
        fetch(url)
        .then(response => response.json())
        .then(data => {
                // Get current UVI from the 'now' field
                const currentUVI = data.now.uvi;
                document.getElementById('uvi').innerText = currentUVI + " UVI";
                document.getElementById('uvi-description').innerText = getUVIDescription(currentUVI);
        });
}

function getUVIDescription(uvi) {
    if (uvi < 3) {
        return "Low risk of harm from UV rays";
    } else if (uvi < 6) {
        return "Moderate risk of harm from UV rays";
    } else if (uvi < 8) {
        return "High risk of harm from UV rays";
    } else if (uvi < 11) {
        return "Very high risk of harm from UV rays";
    } else {
        return "Extreme risk of harm from UV rays";
    }
}

function fetchForecast(lat, lon) {
        const url = `https://api.weatherapi.com/v1/forecast.json?key=${WeatherAPI_key}&q=${lat},${lon}&days=14`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            const forecastContainer = document.getElementById('weather-forecast');
            forecastContainer.innerHTML = ''; // Clear previous forecast

            data.forecast.forecastday.forEach((day, index) => {
                const forecastItem = document.createElement('div');
                forecastItem.classList.add('flex', 'justify-between', 'items-center', 'mb-4');

                const date = new Date(day.date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
                const condition = day.day.condition.text;
                const temp = `${day.day.maxtemp_c}° / ${day.day.mintemp_c}°`;

                forecastItem.innerHTML = `
                    <div>
                        <p class="text-sm">${date}</p>
                        <p class="font-bold">${condition}</p>
                    </div>
                    <div>
                        <p class="text-sm">${temp}</p>
                    </div>
                `;

                forecastContainer.appendChild(forecastItem);

                // Update tomorrow's weather
                if (index === 1) {
                    document.getElementById('tomorrow-temperature').innerText = `${day.day.maxtemp_c}°C`;
                    document.getElementById('tomorrow-description').innerText = condition;
                    document.getElementById('tomorrow-weather-icon').src = `http:${day.day.condition.icon}`;
                }
            });
        });
}

function fetchAQI(lat, lon) {
    const aqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=us_aqi&domains=cams_global`;

    fetch(aqiUrl)
        .then(response => response.json())
        .then(data => {
            if (data.current) {
                const aqi = data.current.us_aqi; // Get the AQI value
                updateAQIDisplay(aqi); // Update the UI with the AQI value
            } else {
                console.error("Error fetching AQI data:", data);
            }
        })
        .catch(error => {
            console.error("Error fetching AQI data:", error);
        });
}

function updateAQIDisplay(aqi) {
    const aqiValueElement = document.getElementById('aqi'); // Assuming you have an element to display AQI
    aqiValueElement.innerText = `${aqi} AQI`; // Updated to include "AQI"

    // Determine the air quality category
    let category;
    if (aqi <= 50) {
        category = "Good";
        document.getElementById('good').classList.add('highlight');
        document.getElementById('standard').classList.remove('highlight');
        document.getElementById('hazardous').classList.remove('highlight');
    } else if (aqi <= 100) {
        category = "Standard";
        document.getElementById('standard').classList.add('highlight');
        document.getElementById('good').classList.remove('highlight');
        document.getElementById('hazardous').classList.remove('highlight');
    } else {
        category = "Hazardous";
        document.getElementById('hazardous').classList.add('highlight');
        document.getElementById('good').classList.remove('highlight');
        document.getElementById('standard').classList.remove('highlight');
    }

    // Update the display for AQI category
    document.getElementById('aqi-category').innerText = category; // Assuming you have an element to display the category
}

function fetchHourlyTemperature(lat, lon) {
    // Using OpenWeatherMap OneCall API 3.0
    const url = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&exclude=minutely,alerts&units=metric&appid=${API_key}`;

    fetch(url)
        .then(response => response.json())
        .then(data => {
            // Get today's hourly forecast
            const today = new Date();
            const hourlyData = data.hourly.filter(hour => {
                const hourDate = new Date(hour.dt * 1000);
                return hourDate.getDate() === today.getDate();
            });

            // Update the temperature segments
            updateDailySegments(hourlyData);
            
            // Update the graph
            updateTemperatureGraph(data.hourly.slice(0, 24));
        })
        .catch(error => {
            console.error("Error fetching hourly data:", error);
            // Fallback to using free weather API
            fetchFallbackHourlyData(lat, lon);
        });
}

// Add a fallback API function using OpenMeteo (completely free, no API key needed)
function fetchFallbackHourlyData(lat, lon) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m&timezone=auto`;
    
    fetch(url)
        .then(response => response.json())
        .then(data => {
            // Convert the data to match our format
            const hourlyData = data.hourly.time.map((time, index) => ({
                dt: new Date(time).getTime() / 1000,
                temp: data.hourly.temperature_2m[index]
            }));

            // Get today's data
            const today = new Date();
            const todayData = hourlyData.filter(hour => {
                const hourDate = new Date(hour.dt * 1000);
                return hourDate.getDate() === today.getDate();
            });

            // Update displays
            updateDailySegments(todayData);
            updateTemperatureGraph(hourlyData.slice(0, 24));
        });
}

// Add function to update daily segments
function updateDailySegments(hourlyData) {
    const segments = {
        morning: [],
        afternoon: [],
        evening: [],
        night: []
    };

    hourlyData.forEach(hour => {
        const hourNum = new Date(hour.dt * 1000).getHours();
        
        if (hourNum >= 6 && hourNum < 12) {
            segments.morning.push(hour.temp);
        } else if (hourNum >= 12 && hourNum < 18) {
            segments.afternoon.push(hour.temp);
        } else if (hourNum >= 18 && hourNum < 22) {
            segments.evening.push(hour.temp);
        } else {
            segments.night.push(hour.temp);
        }
    });

    // Calculate averages and update display
    Object.entries(segments).forEach(([timeOfDay, temps]) => {
        const average = temps.length > 0 
            ?Math.round(temps.reduce((sum, temp) => sum + temp, 0) / temps.length)
            :null;
            
        const element = document.getElementById(`${timeOfDay}-temp`);
        if (element) {
            if (average !== null) {
                element.textContent = `${average}°`;
                // Add weather condition icon based on temperature
                element.parentElement.classList.remove('text-blue-500', 'text-orange-500');
                element.parentElement.classList.add(average > 25 ? 'text-orange-500' : 'text-blue-500');
            } else {
                element.textContent = '--°';
            }
        }
    });
}

function updateTemperatureGraph(hourlyData) {
    const ctx = document.getElementById('temperature-graph').getContext('2d');
    
    const labels = hourlyData.map(hour => {
        const date = new Date(hour.dt * 1000);
        return date.getHours() + ':00';
    });
    
    const temperatures = hourlyData.map(hour => hour.temp);
    
    if (window.temperatureChart) {
        window.temperatureChart.destroy();
    }
    
    window.temperatureChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                data: temperatures,
                borderColor: '#FF7F50',
                backgroundColor: 'rgba(255, 127, 80, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                borderWidth: 2
            }]
        },
        options: CHART_OPTIONS
    });
}

function getUserLocation() {
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
            position => {
                const { latitude, longitude } = position.coords;
                fetchLocationName(latitude, longitude);
                fetchAQI(latitude, longitude); // Fetch AQI data
            },
            error => {
                console.error("Error getting location:", error);
                fetchWeather("Banten"); // fallback location
            }
        );
    } else {
        console.log("Geolocation not supported");
        fetchWeather("Banten"); // fallback location
    }
}

function fetchLocationName(lat, lon) {
    const url = `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${API_key}`;
    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.length > 0) {
                fetchWeather(data[0].name);
            }
        });
}

function enableDarkMode() {
    document.documentElement.classList.add('dark');
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.classList.add('dark');
    }
    // Update chart colors if exists
    if (window.temperatureChart) {
        window.temperatureChart.data.datasets[0].borderColor = '#6366f1';
        window.temperatureChart.data.datasets[0].backgroundColor = 'rgba(99, 102, 241, 0.1)';
        window.temperatureChart.update();
    }
}

function disableDarkMode() {
    document.documentElement.classList.remove('dark');
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.classList.remove('dark');
    }
    // Reset chart colors if exists
    if (window.temperatureChart) {
        window.temperatureChart.data.datasets[0].borderColor = '#FF7F50';
        window.temperatureChart.data.datasets[0].backgroundColor = 'rgba(255, 127, 80, 0.1)';
        window.temperatureChart.update();
    }
}

// Function to set a cookie
function setCookie(name, value, days) {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = name + '=' + encodeURIComponent(value) + '; expires=' + expires + '; path=/';
}

// Function to get a cookie
function getCookie(name) {
    return document.cookie.split('; ').reduce((r, v) => {
        const parts = v.split('=');
        return parts[0] === name ? decodeURIComponent(parts[1]) : r;
    }, '');
}

// Add these calendar functions
function generateCalendar(month, year, weatherData) {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startingDay = firstDay.getDay();
    const totalDays = lastDay.getDate();
    
    const calendarDays = document.getElementById('calendar-days');
    calendarDays.innerHTML = '';
    
    // Update month display
    document.getElementById('calendar-month').textContent = 
        firstDay.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDay; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day empty';
        calendarDays.appendChild(emptyDay);
    }
    
    // Add days with weather data
    for (let day = 1; day <= totalDays; day++) {
        const dayCell = document.createElement('div');
        const currentDate = new Date(year, month, day);
        const isToday = isSameDay(currentDate, new Date());
        
        dayCell.className = `calendar-day ${isToday ? 'today' : ''}`;
        
        const weatherForDay = weatherData.find(data => 
            isSameDay(new Date(data.dt * 1000), currentDate)
        );
        
        if (weatherForDay) {
            const maxTemp = Math.round(weatherForDay.temp.max);
            const minTemp = Math.round(weatherForDay.temp.min);
            const weatherIcon = getWeatherIcon(weatherForDay.weather[0].id);
            
            dayCell.innerHTML = `
                <div class="text-right text-sm flex justify-between items-center">
                    <span>${day}</span>
                </div>
                <div class="weather-icon text-center">
                    <i class="fas ${weatherIcon} ${maxTemp > 25 ? 'text-orange-500' : 'text-blue-500'}"></i>
                    <div class="text-xs text-gray-500">${weatherForDay.weather[0].description}</div>
                </div>
                <div class="text-sm text-center font-semibold">${maxTemp}°</div>
                <div class="text-xs text-gray-500 text-center">${minTemp}°</div>
            `;
        } else {
            dayCell.innerHTML = `<div class="text-right">${day}</div>`;
        }
        
        calendarDays.appendChild(dayCell);
    }
}

function isSameDay(date1, date2) {
    return date1.getDate() === date2.getDate() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getFullYear() === date2.getFullYear();
}

// Update the weather fetch function
function fetchMonthlyWeather(lat, lon, month, year) {
const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m&past_days=92&forecast_days=16&timezone=auto`;
fetch(url)
    .then(response => response.json())
    .then(data => {
        const weatherData = data.hourly.temperature_2m.map((temp, index) => ({
            dt: new Date(data.hourly.time[index]).getTime() / 1000,
            temp: {
                max: temp, // Assuming hourly data is used for max
                min: temp  // Assuming hourly data is used for min
            },
            weather: [{ id: 800, description: "Clear", icon: "fa-sun" }], // Placeholder for weather
            isForecast: true
        }));
        generateCalendar(month, year, weatherData);
        updateTomorrowTemperature(weatherData); // Call the function to update tomorrow's temperature
    })
    .catch(error => {
        console.error("Error fetching weather data:", error);
        generateCalendar(month, year, []);
    });
}

function getWeatherIcon(code) {
    // Map Weatherbit codes to Font Awesome icons
    const codeMap = {
        200: 'fa-bolt',              // Thunderstorm
        300: 'fa-cloud-rain',        // Drizzle
        500: 'fa-cloud-showers-heavy', // Rain
        600: 'fa-snowflake',         // Snow
        700: 'fa-smog',              // Atmosphere
        800: 'fa-sun',               // Clear
        801: 'fa-cloud-sun',         // Few clouds
        802: 'fa-cloud',             // Scattered clouds
        803: 'fa-cloud',             // Broken clouds
        804: 'fa-cloud'              // Overcast clouds
    };
    return codeMap[code] || 'fa-cloud';
}

function updateTomorrowTemperature(weatherData) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1); // Get tomorrow's date
    const tomorrowData = weatherData.find(data => 
        isSameDay(new Date(data.dt * 1000), tomorrow)
    );

    if (tomorrowData) {
        const maxTemp = Math.round(tomorrowData.temp.max);
        const minTemp = Math.round(tomorrowData.temp.min);
        const trendIcon = maxTemp > minTemp ? 'fa-arrow-up' : 'fa-arrow-down'; // Determine trend icon

        document.getElementById('tomorrow-temp').innerHTML = `
            <i class="fas ${trendIcon} text-green-500"></i>
            <span class="text-lg font-semibold ml-2">${maxTemp}°C</span>
        `;
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Get DOM elements
    const themeToggle = document.getElementById('theme-toggle');
    
    // Check for saved theme preference
    const darkMode = getCookie('darkMode');
    if (darkMode === 'true') {
        enableDarkMode();
    } else {
        // Ensure light mode is set as default
        disableDarkMode();
    }
    
    getUserLocation();
    
    // Event listeners
    document.getElementById('search-button').addEventListener('click', () => {
        const cityOrZip = document.getElementById('search-input').value;
        if (cityOrZip) {
            fetchWeather(cityOrZip);
        }
    });
    
    themeToggle.addEventListener('click', () => {
        if (document.documentElement.classList.contains('dark')) {
            disableDarkMode();
            setCookie('darkMode', 'false', 30); // Save theme preference in cookie
        } else {
            enableDarkMode();
            setCookie('darkMode', 'true', 30); // Save theme preference in cookie
        }
    });
    
    // Home button refresh
    document.querySelector('a[href="index.html"]').addEventListener('click', (e) => {
        e.preventDefault();
        window.location.reload();
    });
    
    // Retrieve username from cookie
    const storedUsername = getCookie('username');
    if (storedUsername) {
        document.getElementById('username').innerText = storedUsername;
    } else {
        document.getElementById('username').innerText = 'User'; // Default username
    }
    
    // Retrieve avatar from cookie
    const storedAvatar = getCookie('avatar');
    if (storedAvatar) {
        document.getElementById('user-avatar').src = storedAvatar;
    }
    
    // Calendar button functionality
    const calendarModal = document.getElementById('calendar-modal');
    const calendarBtn = document.getElementById('calendar-btn');
    const closeCalendarBtn = document.getElementById('close-calendar');
    
    calendarBtn.addEventListener('click', (e) => {
        e.preventDefault();
        calendarModal.classList.remove('hidden');
        calendarModal.classList.add('flex');
        // Fetch forecast data when opening modal
        const lat = localStorage.getItem('lat');
        const lon = localStorage.getItem('lon');
        if (lat && lon) {
            fetchMonthlyWeather(lat, lon, new Date().getMonth(), new Date().getFullYear());
        }
    });
    
    closeCalendarBtn.addEventListener('click', () => {
        calendarModal.classList.add('hidden');
        calendarModal.classList.remove('flex');
    });
    
    // Close modal when clicking outside
    calendarModal.addEventListener('click', (e) => {
        if (e.target === calendarModal) {
            calendarModal.classList.add('hidden');
            calendarModal.classList.remove('flex');
        }
    });
    
    // Settings Modal Functionality
    const settingsModal = document.getElementById('settings-modal');
    const settingsBtn = document.querySelector('a[href="settings.html"]');
    const closeSettingsBtn = document.getElementById('close-settings');
    
    // Open Settings
    settingsBtn.addEventListener('click', (e) => {
        e.preventDefault();
        settingsModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    });
    
    // Close Settings
    closeSettingsBtn.addEventListener('click', () => {
        settingsModal.classList.add('hidden');
        document.body.style.overflow = 'auto';
    });
    
    // Close on outside click
    settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
            settingsModal.classList.add('hidden');
            document.body.style.overflow = 'auto';
        }
    });
    
    // Username Change
    document.getElementById('settings-save-username').addEventListener('click', () => {
        const newUsername = document.getElementById('settings-username').value;
        if (newUsername.trim()) {
            document.getElementById('username').innerText = newUsername;
            setCookie('username', newUsername, 30);
            document.getElementById('settings-username').value = '';
        }
    });
    
    // Avatar Selection
    document.querySelectorAll('.avatar-option').forEach(avatar => {
        avatar.addEventListener('click', () => {
            document.getElementById('user-avatar').src = avatar.src;
            setCookie('avatar', avatar.src, 30);
            // Remove selection ring from all avatars
            document.querySelectorAll('.avatar-option').forEach(a => {
                a.classList.remove('ring-2');
            });
            // Add selection ring to clicked avatar
            avatar.classList.add('ring-2');
        });
    });

    // Check if cookies have been accepted
    const cookiesAccepted = getCookie('cookiesAccepted');
    if (!cookiesAccepted) {
        document.getElementById('cookie-consent').style.display = 'flex'; // Show the consent banner
    }

    // Handle cookie acceptance
    document.getElementById('accept-cookies').addEventListener('click', () => {
        setCookie('cookiesAccepted', 'true', 30); // Set cookie for 30 days
        document.getElementById('cookie-consent').style.display = 'none'; // Hide the banner
    });

    // Handle cookie decline
    document.getElementById('decline-cookies').addEventListener('click', () => {
        setCookie('cookiesAccepted', 'false', 30); // Set cookie for 30 days
        document.getElementById('cookie-consent').style.display = 'none'; // Hide the banner
    });
    
    // Update calendar controls
    let currentMonth = new Date().getMonth();
    let currentYear = new Date().getFullYear();
    
    document.getElementById('prev-month').addEventListener('click', () => {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        const lat = localStorage.getItem('lat');
        const lon = localStorage.getItem('lon');
        if (lat && lon) {
            fetchMonthlyWeather(lat, lon, currentMonth, currentYear);
        }
    });
    
    document.getElementById('next-month').addEventListener('click', () => {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        const lat = localStorage.getItem('lat');
        const lon = localStorage.getItem('lon');
        if (lat && lon) {
            fetchMonthlyWeather(lat, lon, currentMonth, currentYear);
        }
    });
    
    // Sidebar toggle functionality
    const sidebarToggle = document.getElementById('sidebar-toggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            const sidebar = document.querySelector('.sidebar');
            if (sidebar.style.display === 'flex' || sidebar.style.display === '') {
                sidebar.style.display = 'none'; // Hide sidebar
            } else {
                sidebar.style.display = 'flex'; // Show sidebar
            }
        });
    }
});

// AQICN feed script
(function (w, d, t, f) {  
    w[f] = w[f] || function (c, k, n) {  
        s = w[f], k = s['k'] = (s['k'] || (k ? ('&k=' + k) : ''));  
        s['c'] = c = (c instanceof Array) ? c : [c];  
        s['n'] = n = n || 0;  
        L = d.createElement(t), e = d.getElementsByTagName(t)[0];  
        L.async = 1;  
        L.src = '//feed.aqicn.org/feed/' + (c[n].city) + '/' + (c[n].lang || '') + '/feed.v1.js?n=' + n + k;  
        e.parentNode.insertBefore(L, e);  
    };  
})(window, document, 'script', '_aqiFeed'); 