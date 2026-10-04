const express = require('express');
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const API_KEY = process.env.OPENWEATHER_API_KEY;

app.use(express.static('public'));
app.use(express.json());

function buildWeatherUrl({ city, lat, lon }) {
  const base = 'https://api.openweathermap.org/data/2.5/weather';
  const params = new URLSearchParams({
    appid: API_KEY,
    units: 'metric'
  });

  if (city) params.set('q', city);
  if (lat !== undefined && lon !== undefined) {
    params.set('lat', lat);
    params.set('lon', lon);
  }

  return `${base}?${params.toString()}`;
}

function buildForecastUrl({ city, lat, lon }) {
  const base = 'https://api.openweathermap.org/data/2.5/forecast';
  const params = new URLSearchParams({
    appid: API_KEY,
    units: 'metric',
    cnt: '40'
  });

  if (city) params.set('q', city);
  if (lat !== undefined && lon !== undefined) {
    params.set('lat', lat);
    params.set('lon', lon);
  }

  return `${base}?${params.toString()}`;
}

app.get('/api/weather', async (req, res) => {
  const { city, lat, lon } = req.query;

  if (!API_KEY) {
    return res.status(500).json({
      error: 'OPENWEATHER_API_KEY is missing. Add it to your .env file.'
    });
  }

  if (!city && (lat === undefined || lon === undefined)) {
    return res.status(400).json({
      error: 'Provide either a city name or latitude and longitude.'
    });
  }

  try {
    const currentUrl = buildWeatherUrl({ city, lat, lon });
    const forecastUrl = buildForecastUrl({ city, lat, lon });

    const [currentResponse, forecastResponse] = await Promise.all([
      axios.get(currentUrl),
      axios.get(forecastUrl)
    ]);

    const current = currentResponse.data;
    const forecast = forecastResponse.data;

    const dailyForecast = [];
    const seenDays = new Set();

    for (const item of forecast.list) {
      const date = new Date(item.dt * 1000);
      const dayKey = date.toISOString().slice(0, 10);

      if (seenDays.has(dayKey)) continue;
      seenDays.add(dayKey);

      dailyForecast.push({
        date: item.dt * 1000,
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        temperature: Math.round(item.main.temp),
        tempMin: Math.round(item.main.temp_min),
        tempMax: Math.round(item.main.temp_max),
        weather: item.weather[0].main,
        description: item.weather[0].description,
        icon: item.weather[0].icon,
        humidity: item.main.humidity,
        wind: Math.round(item.wind.speed)
      });
    }

    const payload = {
      city: current.name,
      country: current.sys.country,
      timezone: current.timezone,
      date: current.dt * 1000,
      temp: Math.round(current.main.temp),
      feelsLike: Math.round(current.main.feels_like),
      humidity: current.main.humidity,
      pressure: current.main.pressure,
      wind: Math.round(current.wind.speed),
      visibility: current.visibility,
      clouds: current.clouds.all,
      weather: current.weather[0].main,
      description: current.weather[0].description,
      icon: current.weather[0].icon,
      sunrise: current.sys.sunrise * 1000,
      sunset: current.sys.sunset * 1000,
      forecast: dailyForecast.slice(0, 5)
    };

    res.json(payload);
  } catch (error) {
    const status = error.response?.status || 500;
    const message = error.response?.data?.message || 'Unable to fetch weather data';

    res.status(status).json({
      error: message
    });
  }
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, message: 'Weather API is running.' });
});

app.listen(PORT, () => {
  console.log(`Weather dashboard running on http://localhost:${PORT}`);
});
