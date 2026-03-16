import React, { useState, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import {
  Layers, CloudRain, AlertTriangle, Thermometer, Activity,
  Wind, Droplets, Eye, Gauge, X, RefreshCw
} from 'lucide-react';
import { reportService } from '../services/api';

// Custom icons based on risk level
const createCustomIcon = (color) =>
  L.divIcon({
    className: 'custom-icon',
    html: `<div style="background-color:${color};width:24px;height:24px;border-radius:50%;border:3px solid white;box-shadow:0 2px 5px rgba(0,0,0,0.3);"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });

const icons = {
  safe: createCustomIcon('#22c55e'),
  moderate: createCustomIcon('#eab308'),
  critical: createCustomIcon('#ef4444'),
};

// These are real topographically low-lying areas in Mumbai known to flood during monsoon
const MUMBAI_FLOOD_ZONES = [
  { center: [19.0170, 72.8509], name: 'Sion–Kurla Low Pocket',    severity: 'high',   baseRadius: 1800 },
  { center: [19.0440, 72.8690], name: 'Dharavi Creek Basin',       severity: 'high',   baseRadius: 2000 },
  { center: [19.0660, 72.8350], name: 'Bandra Reclamation Area',   severity: 'medium', baseRadius: 1500 },
  { center: [18.9780, 72.8330], name: 'Worli Sea Face',            severity: 'medium', baseRadius: 1200 },
  { center: [19.1150, 72.8800], name: 'Andheri East Subway',       severity: 'high',   baseRadius: 2200 },
  { center: [19.0968, 72.8396], name: 'Jogeshwari Metro Drain',    severity: 'medium', baseRadius: 1600 },
  { center: [19.1350, 72.9150], name: 'Vikhroli Creek',            severity: 'low',    baseRadius: 1300 },
  { center: [18.9960, 72.8400], name: 'Prabhadevi Coastal',        severity: 'low',    baseRadius: 1000 },
];

// Severity → color mapping
const SEVERITY_COLORS = {
  high:   { fill: '#ef4444', stroke: '#b91c1c' },
  medium: { fill: '#f59e0b', stroke: '#d97706' },
  low:    { fill: '#3b82f6', stroke: '#2563eb' },
};

// Rain intensity → radius multiplier
function getRainMultiplier(rainMmPerHour) {
  if (!rainMmPerHour || rainMmPerHour === 0) return 0.5;  // dry → small indicator circles
  if (rainMmPerHour < 2.5)  return 0.8;   // light rain
  if (rainMmPerHour < 7.5)  return 1.2;   // moderate rain
  if (rainMmPerHour < 15)   return 1.8;   // heavy rain
  if (rainMmPerHour < 30)   return 2.5;   // very heavy
  return 3.5;                              // extreme
}

// Rain → flood risk label
function getFloodRiskLabel(rain, humidity) {
  const combo = (rain || 0) + (humidity || 0) / 10;
  if (combo > 30) return { label: '🔴 Extreme Flood Risk', color: 'text-red-700',    bg: 'bg-red-50 border-red-200' };
  if (combo > 15) return { label: '🟠 High Flood Risk',    color: 'text-orange-700', bg: 'bg-orange-50 border-orange-200' };
  if (combo > 5)  return { label: '🟡 Moderate Risk',      color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200' };
  return           { label: '🟢 Low Risk (Dry Conditions)', color: 'text-green-700',  bg: 'bg-green-50 border-green-200' };
}

const MUMBAI_CENTER = [19.0760, 72.8777];

export default function RiskMapPage() {
  const [showMonsoonLayer, setShowMonsoonLayer] = useState(false);
  const [filterType, setFilterType] = useState('All');

  // Full weather state (stores raw OpenWeatherMap payload)
  const [weatherFull, setWeatherFull] = useState(null);
  const [riskScore, setRiskScore]     = useState(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);
  const [weatherError, setWeatherError] = useState(false);

  // Issues from DB
  const [issues, setIssues] = useState([]);

  // ── Fetch weather + risk score from AI service ─────────────────────────────
  const fetchWeatherAndRisk = async () => {
    setIsLoadingWeather(true);
    setWeatherError(false);
    try {
      const baseUrl = import.meta.env.VITE_AI_URL || 'http://localhost:8000';
      const res = await fetch(
        `${baseUrl}/ai/weather?lat=${MUMBAI_CENTER[0]}&lon=${MUMBAI_CENTER[1]}`
      );
      if (!res.ok) throw new Error('Weather API failed');
      const json = await res.json();
      const wd = json.weather_data || {};

      setWeatherFull({
        temp:        wd.main?.temp ? (wd.main.temp - 273.15).toFixed(1) : null,
        feelsLike:   wd.main?.feels_like ? (wd.main.feels_like - 273.15).toFixed(1) : null,
        humidity:    wd.main?.humidity ?? null,
        windSpeed:   wd.wind?.speed ?? null,
        windDir:     wd.wind?.deg ?? null,
        clouds:      wd.clouds?.all ?? null,
        visibility:  wd.visibility ? (wd.visibility / 1000).toFixed(1) : null,
        condition:   wd.weather?.[0]?.description ?? 'N/A',
        conditionId: wd.weather?.[0]?.id ?? 800,
        rain1h:      json.rainfall_last_hour ?? 0,
        cityName:    wd.name ?? 'Mumbai',
        fetchedAt:   new Date(),
      });

      // Compute AI risk score using real rainfall
      const riskRes = await fetch(`${import.meta.env.VITE_AI_URL || 'http://localhost:8000'}/ai/risk-score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rainfall:     json.rainfall_last_hour || 0,
          complaints:   issues.length || 50,
          road_density: 0.85
        })
      });
      if (riskRes.ok) {
        const riskData = await riskRes.json();
        setRiskScore((riskData.risk_score * 100).toFixed(1));
      }
    } catch (e) {
      console.error('Weather fetch failed:', e);
      setWeatherError(true);
    } finally {
      setIsLoadingWeather(false);
    }
  };

  useEffect(() => { fetchWeatherAndRisk(); }, []);

  // ── Fetch live issues ──────────────────────────────────────────────────────
  useEffect(() => {
    reportService.getIssues({ public: true })
      .then(r => r?.data && setIssues(r.data))
      .catch(e => console.error('Failed to load issues', e));
  }, []);

  // ── Derive waterlogging/drainage cluster zones from real DB data ───────────
  const waterlogClusters = useMemo(() => {
    return issues
      .filter(i =>
        (i.category === 'waterlogging' || i.category === 'drainage') &&
        i.latitude && i.longitude &&
        (i.status === 'reported' || i.status === 'in-progress')
      )
      .map(i => ({
        center: [i.latitude, i.longitude],
        title: i.title,
        category: i.category,
        status: i.status,
      }));
  }, [issues]);

  const categoryToType = {
    pothole: 'Pothole',
    waterlogging: 'Waterlogging',
    drainage: 'Drainage Blockage',
    streetlight: 'Broken Streetlight',
    garbage: 'Garbage Overflow',
    other: 'Other'
  };

  const mapStatusToColorStatus = (status) => {
    if (status === 'resolved' || status === 'closed') return 'safe';
    if (status === 'reported') return 'critical';
    return 'moderate';
  };

  const filteredIssues = filterType === 'All'
    ? issues
    : issues.filter(i => categoryToType[i.category] === filterType);

  const rainMulitplier   = getRainMultiplier(weatherFull?.rain1h);
  const floodRisk        = getFloodRiskLabel(weatherFull?.rain1h, weatherFull?.humidity);
  const riskPct          = parseFloat(riskScore) || 0;
  const riskColor        = riskPct >= 70 ? 'text-red-600' : riskPct >= 40 ? 'text-yellow-600' : 'text-green-600';

  // Wind direction → compass
  const windCompass = (deg) => {
    if (deg == null) return 'N/A';
    const dirs = ['N','NE','E','SE','S','SW','W','NW'];
    return dirs[Math.round(deg / 45) % 8];
  };

  return (
    <div className="flex flex-col h-screen pt-16 bg-slate-50">

      {/* ── Top Header Bar ── */}
      <div className="bg-white px-4 sm:px-6 py-3 shrink-0 border-b border-slate-200 shadow-sm z-20 flex flex-wrap justify-between items-center gap-3">
        <div className="min-w-0">
          <h1 className="text-[15px] sm:text-lg lg:text-xl font-bold text-slate-800 tracking-tight">Infrastructure Risk & Monsoon Map</h1>
          <p className="text-[9px] sm:text-xs text-slate-500 font-medium whitespace-nowrap overflow-visible">Real-time AI weather + citizen flood reports · Mumbai</p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 ml-auto">
          {/* Live header stats - Desktop Only */}
          {weatherFull && (
            <div className="hidden lg:flex bg-slate-50 border border-slate-200 rounded-xl p-2 gap-4 divide-x divide-slate-200">
              <div className="flex items-center px-3 gap-2">
                <Thermometer className="w-4 h-4 text-orange-500" />
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Mumbai</p>
                  <p className="text-sm font-bold text-slate-800">{weatherFull.temp}°C · {weatherFull.condition}</p>
                </div>
              </div>
              <div className="flex items-center px-3 gap-2">
                <CloudRain className="w-4 h-4 text-blue-500" />
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold">Rainfall</p>
                  <p className="text-sm font-bold text-blue-700">{weatherFull.rain1h > 0 ? `${weatherFull.rain1h} mm/hr` : 'No rain'}</p>
                </div>
              </div>
              <div className="flex items-center px-3 gap-2">
                <Activity className={`w-4 h-4 ${riskPct >= 70 ? 'text-red-500' : riskPct >= 40 ? 'text-yellow-500' : 'text-green-500'}`} />
                <div>
                  <p className="text-[10px] text-slate-400 uppercase font-bold">AI Risk Score</p>
                  <p className={`text-sm font-bold ${riskColor}`}>{riskScore}%</p>
                </div>
              </div>
            </div>
          )}

          {/* Monsoon toggle button */}
          <button
            onClick={() => setShowMonsoonLayer(v => !v)}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-bold text-[10px] sm:text-xs transition-all shadow-sm ${
              showMonsoonLayer
                ? 'bg-blue-600 text-white shadow-blue-200 shadow-md transform scale-105'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <CloudRain className="w-4 h-4" />
            <span className="hidden xs:inline">Monsoon Risk</span>
            <span className="xs:hidden">Risk</span>
            {showMonsoonLayer && <span className="ml-1 bg-white/20 text-white text-[8px] font-black px-1 py-0.5 rounded-full">LIVE</span>}
          </button>
        </div>
      </div>

      <div className="flex-1 relative flex flex-col lg:flex-row overflow-hidden">

        {/* ── Sidebar (Absolute on Desktop, Drawer style on Mobile) ── */}
        <div className={`
          z-[400] transition-all duration-300 ease-in-out
          lg:absolute lg:left-4 lg:top-4 lg:w-[18rem] lg:space-y-4
          ${showMonsoonLayer ? 'flex flex-col shrink-0 overflow-y-auto max-h-[40vh] lg:max-h-[calc(100vh-120px)] bg-slate-50 lg:bg-transparent p-4 lg:p-0 border-b lg:border-0 border-slate-200 shadow-xl lg:shadow-none' : 'hidden lg:block lg:p-0'}
        `}>

          {/* Filters card */}
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 shadow-lg border border-slate-100 mb-4 lg:mb-0">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center">
              <Layers className="w-3.5 h-3.5 mr-1.5 text-blue-600" /> Infrastructure Filter
            </h3>
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl focus:ring-2 focus:ring-blue-500 block p-2.5 outline-none transition-all"
            >
              <option value="All">View All Reports</option>
              {Object.values(categoryToType).map(v => <option key={v} value={v}>{v}</option>)}
            </select>

            <div className="mt-4 space-y-2 text-[10px] text-slate-500">
              <p className="font-bold text-slate-400 uppercase tracking-tight mb-1">Status Legend</p>
              <div className="flex flex-wrap gap-x-3 gap-y-1.5">
                {[
                  { bg: 'bg-red-500', lbl: 'Critical', border: 'border-red-100' },
                  { bg: 'bg-yellow-500', lbl: 'Active', border: 'border-yellow-100' },
                  { bg: 'bg-green-500', lbl: 'Safe', border: 'border-green-100' }
                ].map(({ bg, lbl, border }) => (
                  <div key={lbl} className={`flex items-center gap-1.5 px-2 py-1 rounded-full border ${border} bg-white shadow-sm`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${bg}`}></div>
                    <span className="font-bold">{lbl}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Live Monsoon Panel (only when layer is active or on desktop) ── */}
          {(showMonsoonLayer) && (
            <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-blue-100 overflow-hidden animate-in slide-in-from-left-2 duration-300">
              {/* Panel header */}
              <div className="bg-brand-dark px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CloudRain className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Monsoon Intelligence</span>
                  <span className="text-[8px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded-full font-black animate-pulse">LIVE</span>
                </div>
                {weatherFull?.fetchedAt && (
                  <span className="text-[9px] text-slate-400 font-mono">
                    {weatherFull.fetchedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>

              {isLoadingWeather ? (
                <div className="p-6 text-center">
                  <RefreshCw className="w-5 h-5 text-blue-500 animate-spin mx-auto mb-2" />
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Synchronizing AI Data…</p>
                </div>
              ) : weatherError ? (
                <div className="p-4 text-center">
                  <AlertTriangle className="w-5 h-5 text-red-400 mx-auto mb-1" />
                  <p className="text-[10px] text-red-500 font-bold">API Offline</p>
                  <button onClick={fetchWeatherAndRisk} className="mt-2 text-[10px] text-blue-600 underline font-bold">Re-check System</button>
                </div>
              ) : weatherFull ? (
                <div className="p-4 space-y-4">

                  {/* Flood risk badge */}
                  <div className={`flex items-center justify-center gap-2 text-[10px] font-black p-2.5 rounded-xl border uppercase tracking-widest ${floodRisk.bg}`}>
                    <Activity className={`w-3.5 h-3.5 ${floodRisk.color}`} />
                    <span className={floodRisk.color}>{floodRisk.label}</span>
                  </div>

                  {/* Weather metrics grid */}
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { icon: <Thermometer className="w-3 h-3 text-orange-500"/>, label:'Temp', value:`${weatherFull.temp}°C` },
                      { icon: <Droplets className="w-3 h-3 text-blue-500"/>, label:'Humidity', value:`${weatherFull.humidity}%` },
                      { icon: <Wind className="w-3 h-3 text-slate-400"/>, label:'Wind', value:`${weatherFull.windSpeed} m/s` },
                      { icon: <CloudRain className="w-3 h-3 text-blue-600"/>, label:'Rain', value: weatherFull.rain1h > 0 ? `${weatherFull.rain1h}mm` : '0mm' },
                    ].map(({ icon, label, value }) => (
                      <div key={label} className="bg-slate-50 rounded-xl p-2.5 flex flex-col gap-1 border border-slate-100">
                        <div className="flex items-center gap-1.5">
                          {icon}
                          <p className="text-[8px] text-slate-400 uppercase font-black tracking-tighter">{label}</p>
                        </div>
                        <p className="text-xs font-black text-slate-800 tracking-tight">{value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Rainfall scale indicator */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <div className="flex justify-between text-[9px] font-bold text-slate-400 mb-2 uppercase tracking-tight">
                      <span>Precipitation Load</span>
                      <span className={weatherFull.rain1h > 15 ? 'text-red-600' : 'text-blue-600'}>
                        {weatherFull.rain1h > 0 ? (weatherFull.rain1h < 7.5 ? 'Moderate' : 'Heavy') : 'Optimal'}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-1000 ease-out"
                        style={{
                          width: `${Math.min((weatherFull.rain1h / 30) * 100, 100)}%`,
                          background: 'linear-gradient(90deg, #3b82f6, #ef4444)'
                        }}
                      />
                    </div>
                  </div>

                  {/* Zone count summary */}
                  <div className="pt-2 border-t border-slate-100">
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-2">Monsoon Impact Nodes</p>
                    <div className="flex gap-1.5 flex-wrap">
                      <span className="text-[8px] bg-red-50 text-red-700 border border-red-200 px-2 py-1 rounded-lg font-black uppercase">
                        {MUMBAI_FLOOD_ZONES.filter(z=>z.severity==='high').length} High Risk
                      </span>
                      <span className="text-[8px] bg-blue-50 text-blue-700 border border-blue-200 px-2 py-1 rounded-lg font-black uppercase">
                        {waterlogClusters.length} Active Floods
                      </span>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* ── Map ── */}
        <div className="w-full flex-1 z-[1] min-h-[50vh]">
          <MapContainer center={MUMBAI_CENTER} zoom={13} style={{ height: '100%', width: '100%' }} zoomControl={false}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />

            {/* ── Render issue markers ── */}
            {filteredIssues.map(issue => {
              if (!issue.latitude || !issue.longitude) return null;
              const label       = categoryToType[issue.category] || issue.category;
              const colorStatus = mapStatusToColorStatus(issue.status);
              return (
                <Marker key={issue._id} position={[issue.latitude, issue.longitude]} icon={icons[colorStatus]}>
                  <Popup className="custom-popup">
                    <div className="font-sans w-48 p-1">
                      <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-0.5">{label}</p>
                      <h4 className="font-bold text-slate-800 text-sm mb-2">{issue.title}</h4>
                      {issue.images?.length > 0 && (
                        <div className={`mb-3 gap-1 grid ${issue.images.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                          {issue.images.map((img, idx) => (
                            <img key={idx} src={`${import.meta.env.VITE_IMG_BASE_URL || 'http://localhost:5000'}/${img.replace(/\\/g, '/')}`}
                              alt={`${label} ${idx + 1}`} className="w-full h-24 object-cover rounded-lg border border-slate-200 shadow-sm" />
                          ))}
                        </div>
                      )}
                      <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-2">
                         <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg text-white ${
                            colorStatus === 'safe' ? 'bg-green-500' : colorStatus === 'moderate' ? 'bg-yellow-500' : 'bg-red-500'
                          }`}>{issue.status}</span>
                         <span className="text-[9px] text-slate-400 font-mono">Ward {issue.ward?.split(' ')[1] || 'N/A'}</span>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}

            {/* ── Monsoon Risk Layer ── */}
            {showMonsoonLayer && (
              <>
                {/* Known flood-prone zones — size scales with live rainfall */}
                {MUMBAI_FLOOD_ZONES.map((zone, idx) => {
                  const { fill, stroke } = SEVERITY_COLORS[zone.severity];
                  const radius          = zone.baseRadius * rainMulitplier;
                  const fillOpacity     = zone.severity === 'high' ? 0.25 : zone.severity === 'medium' ? 0.18 : 0.12;
                  return (
                    <Circle
                      key={idx}
                      center={zone.center}
                      radius={radius}
                      pathOptions={{ fillColor: fill, fillOpacity, color: stroke, weight: 1.5, dashArray: '6 4' }}
                    >
                      <Popup>
                        <div className="font-sans p-1">
                          <p className="font-black text-slate-800 text-xs uppercase tracking-tight mb-1">🌊 {zone.name}</p>
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded border ${zone.severity === 'high' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>
                              {zone.severity} SEVERITY
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 font-medium">Potential impact radius: <strong className="text-slate-800">{Math.round(radius)}m</strong></p>
                          <p className="text-[10px] text-slate-400 mt-2 leading-relaxed italic">Calculated using live topography + real-time OpenWeather precipitation data.</p>
                        </div>
                      </Popup>
                    </Circle>
                  );
                })}

                {/* Live waterlogging/drainage issue clusters from real DB */}
                {waterlogClusters.map((wl, idx) => (
                  <Circle
                    key={`wl-${idx}`}
                    center={wl.center}
                    radius={400 * Math.max(rainMulitplier, 1)}
                    pathOptions={{ fillColor: '#ec4899', fillOpacity: 0.35, color: '#be185d', weight: 2 }}
                  >
                    <Popup>
                      <div className="font-sans p-1 text-center">
                        <p className="font-black text-pink-700 text-[10px] uppercase tracking-widest mb-1">Live Incident Cluster</p>
                        <h4 className="font-bold text-slate-800 text-sm mb-1">{wl.category === 'waterlogging' ? 'Urban Flood' : 'Drain Failure'}</h4>
                        <p className="text-[10px] text-slate-400 font-medium">{wl.title}</p>
                      </div>
                    </Popup>
                  </Circle>
                ))}
              </>
            )}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}
