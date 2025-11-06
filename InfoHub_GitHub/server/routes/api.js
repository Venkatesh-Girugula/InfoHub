const express = require('express')
const axios = require('axios')
const router = express.Router()

const FALLBACK_QUOTES = [
  {content: "The only way to do great work is to love what you do.", author: "Steve Jobs"},
  {content: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson"}
]

router.get('/weather', async (req, res) => {
  const city = String(req.query.city || '').trim()
  if (!city) return res.status(400).json({error: 'city query param required'})
  try {
    const key = process.env.OPENWEATHER_KEY
    if (key) {
      const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${key}`
      const r = await axios.get(url, {timeout: 8000})
      const d = r.data || {}
      const temp = d?.main?.temp
      const desc = Array.isArray(d.weather) && d.weather[0] ? d.weather[0].description : null
      if (temp == null || !desc) return res.status(502).json({error:'unexpected response from weather provider'})
      return res.json({city: d.name || city, temp, desc})
    } else {
      const geo = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: { q: city, format: 'json', limit: 1 }, timeout: 8000, headers: {'Accept-Language': 'en'}
      })
      if (Array.isArray(geo.data) && geo.data.length>0) {
        const { lat, lon, display_name } = geo.data[0]
        const weather = await axios.get('https://api.open-meteo.com/v1/forecast', {
          params: { latitude: lat, longitude: lon, current_weather: true, timezone: 'auto' }, timeout: 8000
        })
        const cw = weather.data?.current_weather
        if (cw && typeof cw.temperature !== 'undefined') {
          return res.json({ city: (display_name||city).split(',')[0], temp: cw.temperature, desc: `wind ${cw.windspeed} m/s` })
        }
      }
      return res.json({city, temp: 28.5, desc: 'clear sky (mock)'})
    }
  } catch (err) {
    return res.status(500).json({error: 'failed to fetch weather', detail: String(err.message||err)})
  }
})

router.get('/convert', async (req, res) => {
  const from = String(req.query.from || 'INR').toUpperCase()
  const to = String(req.query.to || 'USD').toUpperCase()
  const amount = Number(req.query.amount || 1)
  if (!isFinite(amount) || amount <= 0) return res.status(400).json({error: 'amount must be positive number'})
  try {
    const url = `https://api.exchangerate.host/convert?from=${from}&to=${to}&amount=${amount}`
    const r = await axios.get(url, {timeout: 8000})
    const result = r.data?.result
    if (result == null) return res.status(502).json({error:'bad response from exchange API'})
    return res.json({from, to, amount, result: Number(Number(result).toFixed(2))})
  } catch (err) {
    const rates = { INR_USD:0.012, INR_EUR:0.011, INR_GBP:0.0096, INR_AUD:0.018, INR_CAD:0.016, INR_JPY:1.8, INR_AED:0.044, INR_SGD:0.016 }
    const key = `${from}_${to}`
    if (rates[key]) return res.json({from, to, amount, result: Number((amount * rates[key]).toFixed(2)), fallback:true})
    return res.status(500).json({error: 'conversion failed', detail: String(err.message||err)})
  }
})

router.get('/quote', async (req, res) => {
  try {
    const r = await axios.get('https://api.quotable.io/random', {timeout: 6000})
    const d = r.data || {}
    if (!d.content) throw new Error('no quote returned')
    return res.json({content: d.content, author: d.author || 'Unknown'})
  } catch (err) {
    const q = FALLBACK_QUOTES[Math.floor(Math.random() * FALLBACK_QUOTES.length)]
    return res.json(q)
  }
})

module.exports = router
