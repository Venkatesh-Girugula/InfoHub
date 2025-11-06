import React, { useState } from 'react'
import axios from 'axios'

const css = `
:root{ --bg:#f5f7fb; --txt:#0f172a; --muted:#475569; --card:#ffffff; --ring:#e2e8f0; --accent:#2563eb; --accent-2:#7c3aed }
*{ box-sizing:border-box }
html,body,#root{ height:100% }
body{ margin:0; font-family: Inter, system-ui, Segoe UI, Roboto, Arial; color:var(--txt); background:linear-gradient(180deg,#eef2ff, #f8fafc 30%, var(--bg)); animation:bgShift 10s ease-in-out infinite alternate }
@keyframes bgShift { 0%{background-position:0 0;} 100%{background-position:0 40%;} }
.container{ max-width:920px; margin:24px auto 64px; padding:0 16px }
.header{ display:flex; align-items:center; justify-content:center; gap:10px; padding:28px 0 6px }
.brand{ display:flex; align-items:center; gap:10px }
.logo{ width:40px; height:40px; border-radius:12px; background:linear-gradient(135deg,var(--accent),var(--accent-2)); box-shadow:0 10px 30px rgba(124,58,237,.25); animation:float 5s ease-in-out infinite }
@keyframes float{ 0%,100%{ transform:translateY(0) } 50%{ transform:translateY(-4px) } }
h1{ font-size:28px; margin:0 }
.subtitle{ text-align:center; color:var(--muted); margin:6px 0 18px; font-size:14px }
.tabs{ display:flex; gap:10px; justify-content:center; position:sticky; top:0; padding:8px 0; backdrop-filter:saturate(140%) blur(6px) }
.tabs button{ padding:10px 14px; border-radius:999px; border:1px solid var(--ring); background:var(--card); font-weight:600; transition:transform .08s ease, box-shadow .2s ease }
.tabs button:hover{ transform:translateY(-1px); box-shadow:0 6px 24px rgba(30,41,59,.12) }
.tabs button.active{ border-color:transparent; background:linear-gradient(135deg,#fff, #f1f5f9); box-shadow:0 6px 20px rgba(30,41,59,.08) }
.main{ margin-top:14px }
.grid{ display:grid; grid-template-columns: repeat(12,1fr); gap:14px }
.col-12{ grid-column: span 12 }
.card{ background:var(--card); padding:18px; border-radius:16px; border:1px solid var(--ring); box-shadow:0 10px 30px rgba(2,6,23,.04); transition:transform .12s ease, box-shadow .2s ease }
.card:hover{ transform:translateY(-2px); box-shadow:0 12px 36px rgba(2,6,23,.07) }
.card h2{ margin:0 0 10px; font-size:18px }
.row{ display:flex; gap:10px; margin:12px 0; align-items:center }
input, select{ padding:10px 12px; border-radius:10px; border:1px solid var(--ring); flex:1; background:#fff }
button{ cursor:pointer; padding:10px 14px; border-radius:10px; border:1px solid var(--ring); background:#fff; transition:transform .05s ease, box-shadow .2s ease }
.button-primary{ background:linear-gradient(135deg,#3b82f6,#6366f1); color:#fff; border:0; box-shadow:0 10px 24px rgba(59,130,246,.25) }
.btn-pill{ border-radius:999px }
.error{ color:#b00020 }
.note{ color:#334155; font-size:13px }
blockquote{ margin:16px 0; padding-left:12px; border-left:3px solid #e2e8f0 }
footer{ text-align:center; color:#64748b; margin-top:28px; font-size:12px }
.hero{ display:grid; grid-template-columns: repeat(3, 1fr); gap:16px }
@media (max-width: 800px){ .hero{ grid-template-columns: 1fr } }
.action .title{ font-weight:700; font-size:16px }
.action .desc{ color:#475569; font-size:14px }
`;
if (typeof document !== 'undefined' && !document.getElementById('infohub-styles')){
  const style = document.createElement('style'); style.id='infohub-styles'; style.innerHTML = css; document.head.appendChild(style);
}

// Public APIs (no backend required)
async function fetchWeatherPublic(city){
  try{
    const geo = await axios.get('https://nominatim.openstreetmap.org/search', { params:{ q:city, format:'json', limit:1 }, timeout:8000, headers:{'Accept-Language':'en'} })
    if (Array.isArray(geo.data) && geo.data.length){
      const { lat, lon, display_name } = geo.data[0]
      const weather = await axios.get('https://api.open-meteo.com/v1/forecast', { params:{ latitude:lat, longitude:lon, current_weather:true, timezone:'auto' }, timeout:8000 })
      const cw = weather.data?.current_weather
      if (cw && typeof cw.temperature !== 'undefined'){
        return { city:(display_name||city).split(',')[0], temp:cw.temperature, desc:`wind ${cw.windspeed} m/s` }
      }
    }
  }catch(e){}
  return { city, temp:28.5, desc:'clear sky (mock)' }
}

async function convertViaPublic(from, to, amount){
  try{
    const r = await axios.get('https://api.exchangerate.host/convert', { params:{ from, to, amount }, timeout:8000 })
    if (r.data && typeof r.data.result !== 'undefined') return { from, to, amount, result:Number(Number(r.data.result).toFixed(2)) }
  }catch(e){}
  const rates = { INR_USD:0.012, INR_EUR:0.011, INR_GBP:0.0096, INR_AUD:0.018, INR_CAD:0.016, INR_JPY:1.8, INR_AED:0.044, INR_SGD:0.016 }
  const key = `${from}_${to}`
  if (Object.prototype.hasOwnProperty.call(rates, key)){
    const raw = amount * rates[key]
    return { from, to, amount, result:Number(raw.toFixed(2)), fallback:true }
  }
  throw new Error('conversion failed (no rate available)')
}

async function quoteViaPublic(){
  const r = await axios.get('https://api.quotable.io/random', { timeout:6000 })
  if (r.data && r.data.content) return { content:r.data.content, author:r.data.author || 'Unknown' }
  throw new Error('no quote returned')
}

function Weather(){
  const [city, setCity] = useState('Hyderabad')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchWeather = async () => {
    const c = String(city||'').trim()
    if (!c){ setError('Please enter a city'); setData(null); return }
    setLoading(true); setError(null)
    try{ const res = await fetchWeatherPublic(c); setData(res) }
    catch(err){ setError(String(err?.message || 'Failed to fetch')); setData(null) }
    finally{ setLoading(false) }
  }

  const onKeyDown = (e) => { if (e.key === 'Enter'){ e.preventDefault(); fetchWeather() } }

  return (
    <div className="card">
      <h2>Weather</h2>
      <p className="note">Type a city and press Enter or click Get.</p>
      <div className="row">
        <input value={city} onChange={e=>setCity(e.target.value)} onKeyDown={onKeyDown} placeholder="Enter city" />
        <button className="button-primary" onClick={fetchWeather} disabled={loading}>Get</button>
      </div>
      {loading && <p>Loading...</p>}
      {error && <p className="error">{error}</p>}
      {data && (<div><p><strong>{data.city}</strong></p><p>Temp: {Number(data.temp).toFixed(2)} °C</p><p>{data.desc}</p></div>)}
    </div>
  )
}

function Converter(){
  const TO_OPTIONS = ['USD','EUR','GBP','AUD','CAD','JPY','AED','SGD']
  const [amount, setAmount] = useState(100)
  const [to, setTo] = useState('USD')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const convert = async () => {
    const amt = Number(amount)
    if (!isFinite(amt) || amt <= 0){ setError('Enter an amount greater than 0'); setResult(null); return }
    setLoading(true); setError(null)
    try{ const res = await convertViaPublic('INR', to, amt); setResult(res) }
    catch(err){ setError(String(err?.message || 'Conversion failed')); setResult(null) }
    finally{ setLoading(false) }
  }

  const onKeyDown = (e) => { if (e.key === 'Enter'){ e.preventDefault(); convert() } }

  return (
    <div className="card">
      <h2>Currency Converter</h2>
      <p className="note">Convert INR to other currencies using live rates.</p>
      <div className="row">
        <input type="number" min="0" step="0.01" value={amount} onChange={e=>setAmount(e.target.value)} onKeyDown={onKeyDown} />
        <select value={to} onChange={e=>setTo(e.target.value)}>
          {TO_OPTIONS.map(code => <option key={code} value={code}>{code}</option>)}
        </select>
        <button className="button-primary" onClick={convert} disabled={loading}>Convert</button>
      </div>
      {loading && <p>Converting...</p>}
      {error && <p className="error">{error}</p>}
      {result && (<div><p>{result.amount} {result.from} = <strong>{Number(result.result).toFixed(2)}</strong> {result.to}</p>{result.fallback && <p className="note">(Displayed using fallback rate)</p>}</div>)}
    </div>
  )
}

function Quotes(){
  const [quote, setQuote] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const getQuote = async () => {
    setLoading(true); setError(null)
    try{
      const q = await quoteViaPublic()
      setQuote(q)
    }catch(err){
      const FALLBACK_QUOTES = [
        { content:'The only way to do great work is to love what you do.', author:'Steve Jobs' },
        { content:"Don't watch the clock; do what it does. Keep going.", author:'Sam Levenson' }
      ]
      setQuote(FALLBACK_QUOTES[Math.floor(Math.random()*FALLBACK_QUOTES.length)])
    }finally{
      setLoading(false)
    }
  }

  return (
    <div className="card">
      <h2>Motivational Quote</h2>
      <p className="note">Press the button to get a new quote.</p>
      <button className="button-primary" onClick={getQuote} disabled={loading}>New Quote</button>
      {loading && <p>Loading...</p>}
      {error && <p className="error">{error}</p>}
      {quote && (<blockquote><p>"{quote.content}"</p><footer>- {quote.author || 'Unknown'}</footer></blockquote>)}
    </div>
  )
}

function Home({ onNavigate }){
  return (
    <div className="grid">
      <div className="col-12">
        <div className="card">
          <h2>Welcome to InfoHub</h2>
          <p className="note">Three handy tools in one place. Choose an action below or use the tabs above.</p>
          <div className="hero">
            <div className="card action">
              <div className="title">Weather</div>
              <div className="desc">Get the current temperature and conditions for any city.</div>
              <button className="button-primary" onClick={() => onNavigate('weather')}>Check Weather</button>
            </div>
            <div className="card action">
              <div className="title">Converter</div>
              <div className="desc">Convert INR to popular currencies with live rates.</div>
              <button className="button-primary" onClick={() => onNavigate('convert')}>Convert Now</button>
            </div>
            <div className="card action">
              <div className="title">Quotes</div>
              <div className="desc">Spark motivation with a fresh quote.</div>
              <button className="button-primary" onClick={() => onNavigate('quotes')}>Get a Quote</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function App(){
  const [tab, setTab] = useState('home')
  return (
    <div className="container">
      <div className="header">
        <div className="brand"><div className="logo" /><h1>InfoHub</h1></div>
      </div>
      <p className="subtitle">Weather • Currency • Quotes — unified, simple, fast</p>
      <nav className="tabs">
        <button onClick={() => setTab('home')} className={tab === 'home' ? 'active btn-pill' : 'btn-pill'}>Home</button>
        <button onClick={() => setTab('weather')} className={tab === 'weather' ? 'active btn-pill' : 'btn-pill'}>Weather</button>
        <button onClick={() => setTab('convert')} className={tab === 'convert' ? 'active btn-pill' : 'btn-pill'}>Converter</button>
        <button onClick={() => setTab('quotes')} className={tab === 'quotes' ? 'active btn-pill' : 'btn-pill'}>Quotes</button>
      </nav>
      <div className="main">
        {tab === 'home' && <Home onNavigate={setTab} />}
        {tab === 'weather' && <Weather />}
        {tab === 'convert' && <Converter />}
        {tab === 'quotes' && <Quotes />}
      </div>
      <footer>© {new Date().getFullYear()} InfoHub</footer>
    </div>
  )
}
