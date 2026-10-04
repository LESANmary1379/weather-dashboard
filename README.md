const appState = {
  defaultCity: 'London'
};

const cityInput = document.getElementById('cityInput');
const searchForm = document.getElementById('searchForm');
const locationBtn = document.getElementById('locationBtn');
const forecastGrid = document.getElementById('forecastGrid');

const elements = {
  currentDate: document.getElementById('currentDate'),
  cityName: document.getElementById('cityName'),
  temperature: document.getElementById('temperature'),
  weatherDescription: document.getElementById('weatherDescription'),
  weatherIcon: document.getElementById('weatherIcon'),
  feelsLike: document.getElementById('feelsLike'),
  windSpeed: document.getElementById('windSpeed'),
  humidity: document.getElementById('humidity'),
  pressure: document.getElementById('pressure'),
  clouds: document.getElementById('clouds'),
  visibility: document.getElementById('visibility')
};

function formatDay(dateValue) {
  return new Date(dateValue).toLocaleDateString('en-US', {
    weekday: 'short'
  });
}

function formatDate(dateValue) {
  return new Date(dateValue).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
}

function formatVisibility(value) {
  return `${(value / 1000).toFixed(1)} km`;
}

function updateForecast(data) {
  forecastGrid.innerHTML = '';

  if (!data?.forecast || !data.forecast.length) {
    forecastGrid.innerHTML = '<p class="empty-state">Forecast unavailable.</p>';
    return;
  }

  data.forecast.forEach((day) => {
    const card = document.createElement('article');
    card.className = 'forecast-item';

    card.innerHTML = `
      <p class="forecast-day">${formatDay(day.date)}</p>
      <img src="https://openweathermap.org/img/wn/${day.icon}@2x.png" alt="${day.description}" />
      <p class="forecast-weather">${day.weather}</p>
      <div class="forecast-temp">
        <strong>${day.tempMax}°</strong>
        <span>${day.tempMin}°</span>
      </div>
    `;

    forecastGrid.appendChild(card);
  });
}

function renderWeather(data) {
  if (!data) return;

  elements.currentDate.textContent = formatDate(data.date);
  elements.cityName.textContent = `${data.city}, ${data.country}`;
  elements.temperature.textContent = `${data.temp}°C`;
  elements.weatherDescription.textContent = data.description;
  elements.weatherIcon.src = `https://openweathermap.org/img/wn/${data.icon}@2x.png`;
  elements.feelsLike.textContent = `${data.feelsLike}°C`;
  elements.windSpeed.textContent = `${data.wind} km/h`;
  elements.humidity.textContent = `${data.humidity}%`;
  elements.pressure.textContent = `${data.pressure} hPa`;
  elements.clouds.textContent = `${data.clouds}%`;
  elements.visibility.textContent = formatVisibility(data.visibility);

  updateForecast(data);
}

async function fetchWeather({ city, lat, lon } = {}) {
  const params = new URLSearchParams();

  if (city) params.set('city', city);
  if (lat !== undefined) params.set('lat', lat);
  if (lon !== undefined) params.set('lon', lon);

  const res = await fetch(`/api/weather?${params.toString()}`);
  const result = await res.json();

  if (!res.ok) {
    throw new Error(result.error || 'Unable to fetch weather data');
  }

  renderWeather(result);
}

async function loadDefaultWeather() {
  try {
    await fetchWeather({ city: appState.defaultCity });
  } catch (error) {
    console.error(error);
    elements.cityName.textContent = 'Weather unavailable';
    elements.weatherDescription.textContent = error.message;
  }
}

searchForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const city = cityInput.value.trim();

  if (!city) return;

  try {
    await fetchWeather({ city });
  } catch (error) {
    alert(error.message);
  }
});

locationBtn.addEventListener('click', () => {
  if (!navigator.geolocation) {
    alert('Geolocation is not supported by your browser.');
    return;
  }

  locationBtn.disabled = true;
  locationBtn.textContent = 'Locating...';

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { latitude, longitude } = position.coords;
      try {
        await fetchWeather({ lat: latitude, lon: longitude });
      } catch (error) {
        alert(error.message);
      } finally {
        locationBtn.disabled = false;
        locationBtn.textContent = 'Use My Location';
      }
    },
    () => {
      locationBtn.disabled = false;
      locationBtn.textContent = 'Use My Location';
      alert('Location access was denied. Try searching for a city instead.');
    }
  );
});

loadDefaultWeather();
