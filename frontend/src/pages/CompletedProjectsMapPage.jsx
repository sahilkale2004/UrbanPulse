import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Layers, CheckCircle, Filter, X } from 'lucide-react';
import { reportService } from '../services/api';

// Custom icon for completed projects
const createCustomIcon = (color) => {
  return L.divIcon({
    className: 'custom-icon',
    html: `
      <div style="
        background-color: ${color};
        width: 24px;
        height: 24px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 5px rgba(0,0,0,0.3);
      "></div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
};

const completedIcon = createCustomIcon('#22c55e'); // Green
const closedIcon = createCustomIcon('#64748b'); // Slate

export default function CompletedProjectsMapPage() {
  const [filterType, setFilterType] = useState('All');
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  
  // India-level center so all city markers are visible
  const center = [20.5937, 78.9629];

  useEffect(() => {
    const fetchLiveIssues = async () => {
      try {
        const response = await reportService.getIssues({ public: true });
        if (response && response.data) {
          // Filter out ONLY completed (resolved/closed) issues
          const completedIssues = response.data.filter(i => i.status === 'resolved' || i.status === 'closed');
          setIssues(completedIssues);
        }
      } catch (err) {
        console.error("Failed to load map issues", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLiveIssues();
  }, []);

  const categoryToType = {
    'pothole': 'Pothole Fixed',
    'waterlogging': 'Drainage Cleared',
    'drainage': 'Drainage Cleared',
    'streetlight': 'Streetlight Repaired',
    'garbage': 'Garbage Cleared',
    'other': 'Issue Resolved'
  };

  const filteredIssues = filterType === 'All' 
    ? issues 
    : issues.filter(i => categoryToType[i.category] === filterType);

  const FilterControls = ({ isMobile = false }) => (
    <>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest flex items-center">
          <Layers className="w-4 h-4 mr-2 text-green-600" /> Filters
        </h3>
        {isMobile && (
          <button onClick={() => setShowMobileFilters(false)} className="p-1 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        )}
      </div>
      
      <div className="mb-5">
        <p className="text-sm font-semibold text-slate-700 mb-2">Project Type</p>
        <select 
          value={filterType} 
          onChange={e => {
            setFilterType(e.target.value);
            if(isMobile) setTimeout(() => setShowMobileFilters(false), 300);
          }}
          className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-green-500 focus:border-green-500 block p-2.5 outline-none"
        >
          <option value="All">All Completed</option>
          <option value="Pothole Fixed">Roads Repaired</option>
          <option value="Drainage Cleared">Drainage & Flooding Clearances</option>
          <option value="Streetlight Repaired">Lights Repaired</option>
          <option value="Garbage Cleared">Garbage Cleared</option>
        </select>
      </div>

      <div className="mb-5">
        <p className="text-sm font-semibold text-slate-700 mb-2">Statistics</p>
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
          {loading ? (
            <p className="text-sm text-slate-500 animate-pulse">Loading...</p>
          ) : filteredIssues.length === 0 ? (
            <p className="text-xs text-slate-500">No completed projects yet. Once municipal authorities mark issues as Resolved or Closed, they will appear here.</p>
          ) : (
            <>
              <p className="text-2xl font-bold text-green-700">{filteredIssues.length}</p>
              <p className="text-xs text-green-600 font-medium">Completed Projects</p>
            </>
          )}
        </div>
      </div>
      <div className="mb-2">
        <p className="text-sm font-semibold text-slate-700 mb-2">Legend</p>
        <div className="space-y-2 text-sm text-slate-600">
          <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div> Successfully Resolved</div>
          <div className="flex items-center mt-1"><div className="w-3 h-3 rounded-full bg-slate-500 mr-2"></div> Officially Closed</div>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex flex-col h-screen pt-16 bg-white overflow-hidden">
      
      {/* Header Panel */}
      <div className="bg-white px-4 sm:px-6 py-3 sm:py-4 shrink-0 border-b border-slate-200 shadow-sm z-30 flex justify-between items-center">
        <div>
          <h1 className="text-[15px] sm:text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <CheckCircle className="text-green-500 w-5 h-5 sm:w-6 sm:h-6 shrink-0" /> <span>Completed Projects Map</span>
          </h1>
          <p className="text-[9px] sm:text-sm text-slate-500 font-medium">Tracking infrastructure improvements and successfully resolved civic issues.</p>
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden">
        
        {/* Desktop Sidebar Controls */}
        <div className="hidden md:block absolute left-6 top-6 z-[400] w-72 bg-white/90 backdrop-blur-md rounded-2xl p-5 shadow-lg border border-slate-100">
          <FilterControls />
        </div>

        {/* Mobile Filter Toggle Button — Top Left below zoom controls */}
        <button 
          onClick={() => setShowMobileFilters(true)}
          className="md:hidden absolute left-[12px] top-[90px] z-[1000] w-[34px] h-[34px] bg-white text-slate-700 rounded shadow-sm border border-slate-300 hover:bg-slate-50 active:bg-slate-100 flex items-center justify-center"
          title="Open Filters"
        >
          <Filter className="w-[18px] h-[18px]" />
        </button>

        {/* Mobile Filter Overlay */}
        {showMobileFilters && (
          <div className="md:hidden fixed inset-0 z-[500] bg-slate-900/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 transition-all duration-300">
            <div 
              className="bg-white w-full max-w-sm rounded-t-[2rem] sm:rounded-2xl p-6 shadow-2xl animate-in slide-in-from-bottom-10 duration-300"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6 sm:hidden" onClick={() => setShowMobileFilters(false)} />
              <FilterControls isMobile />
            </div>
            <div className="absolute inset-0 -z-10" onClick={() => setShowMobileFilters(false)} />
          </div>
        )}

        {/* Map Container */}
        <div className="w-full h-full z-[1]">
          <MapContainer center={center} zoom={6} style={{ height: "100%", width: "100%" }} zoomControl={true}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />
            
            {/* Render Issues */}
            {filteredIssues.map((issue) => {
              if (!issue.latitude || !issue.longitude) return null;
              
              const issueTypeLabel = categoryToType[issue.category] || 'Issue Resolved';
              const iconToUse = issue.status === 'closed' ? closedIcon : completedIcon;
              const statusBgColor = issue.status === 'closed' ? 'bg-slate-500' : 'bg-green-500';

              return (
                <Marker key={issue._id} position={[issue.latitude, issue.longitude]} icon={iconToUse}>
                  <Popup className="custom-map-popup">
                    <div className="font-sans w-48 sm:w-56 p-1">
                      <p className={`font-bold ${issue.status === 'closed' ? 'text-slate-700' : 'text-green-700'} text-xs sm:text-sm mb-1 flex items-center gap-1`}>
                        <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" /> {issueTypeLabel}
                      </p>
                      <p className="text-[10px] sm:text-xs text-slate-600 mb-2 leading-tight">{issue.title}</p>
                      
                      {issue.images && issue.images.length > 0 && (
                        <div className={`mb-2 gap-1 grid ${issue.images.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                          {issue.images.map((img, idx) => (
                            <img 
                              key={idx}
                              src={`${import.meta.env.VITE_IMG_BASE_URL || 'http://localhost:5000'}/${img.replace(/\\/g, '/')}`} 
                              alt={`${issueTypeLabel} ${idx + 1}`} 
                              className="w-full h-20 sm:h-24 object-cover rounded border border-slate-200 shadow-sm"
                            />
                          ))}
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        <span className="text-[8px] sm:text-[10px] text-slate-500 font-mono bg-slate-100 rounded px-1.5 py-0.5 whitespace-nowrap">
                          {issue.latitude.toFixed(4)}, {issue.longitude.toFixed(4)}
                        </span>
                        <span className={`text-[8px] sm:text-[10px] font-bold uppercase px-2 py-0.5 rounded-full text-white ${statusBgColor}`}>
                          {issue.status.replace('-', ' ')}
                        </span>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>

      </div>
    </div>
  );
}

