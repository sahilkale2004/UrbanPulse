import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, Calendar, Flag, Clock, MapPin, CheckCircle, AlertCircle, User } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { reportService } from '../services/api';

// Fix for default marker icon
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const statusStyles = {
  'reported': 'bg-red-100 text-red-700 border-red-200',
  'assigned': 'bg-orange-100 text-orange-700 border-orange-200',
  'in-progress': 'bg-blue-100 text-blue-700 border-blue-200',
  'resolved': 'bg-green-100 text-green-700 border-green-200',
  'closed': 'bg-slate-200 text-slate-700 border-slate-300'
};

export default function IssueDetailsPage() {
  const { id } = useParams();
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [notes, setNotes] = useState('');
  const [imageFiles, setImageFiles] = useState([]);
  const [updating, setUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);

  useEffect(() => {
    const fetchIssue = async () => {
      try {
        const res = await reportService.getIssueById(id);
        if (res.success) {
          setIssue(res.data);
          setNewStatus(res.data.status);
        }
      } catch (err) {
        setError('Could not load issue details.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchIssue();
  }, [id]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setUpdating(true);
    try {
      let payload;
      if (imageFiles.length > 0 && (newStatus === 'in-progress' || newStatus === 'resolved')) {
        payload = new FormData();
        payload.append('status', newStatus);
        payload.append('notes', notes);
        imageFiles.forEach(file => payload.append('images', file));
      } else {
        payload = { status: newStatus, notes };
      }
      const res = await reportService.updateIssue(id, payload);
      if (res.success) {
        setIssue(res.data);
        setUpdateSuccess(true);
        setTimeout(() => setUpdateSuccess(false), 3000);
        setNotes('');
        setImageFiles([]);
        const fileInput = document.getElementById('status-image-upload');
        if (fileInput) fileInput.value = '';
      }
    } catch (err) {
      alert('Failed to update the issue. Check your permissions.');
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 bg-slate-50 min-h-screen pt-20 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !issue) {
    return (
      <div className="flex-1 bg-slate-50 min-h-screen pt-20 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <p className="text-slate-600">{error || 'Issue not found.'}</p>
          <Link to="/ward-management" className="mt-4 inline-block text-blue-600 hover:underline">← Back to Ward Management</Link>
        </div>
      </div>
    );
  }

  const issueLocation = issue.latitude && issue.longitude ? [issue.latitude, issue.longitude] : null;

  return (
    <div className="flex-1 bg-slate-50 min-h-screen pt-20 px-4 sm:px-6 lg:px-8 pb-12 w-full max-w-6xl mx-auto">
      
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3 line-clamp-2">
          Issue Details: <span className="text-blue-700">#{id.substring(id.length - 8).toUpperCase()}</span> — {issue.title}
        </h1>
        <Link to="/ward-management" className="text-xs sm:text-sm border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg inline-flex items-center transition-colors shadow-sm">
          <ChevronLeft className="w-4 h-4 mr-1" /> Back to Ward Management
        </Link>
      </div>

      {updateSuccess && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2 text-xs sm:text-sm font-medium shadow-sm animate-in fade-in slide-in-from-top-2">
          <CheckCircle className="w-4 h-4" /> Status updated successfully!
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        
        {/* Left Column (Info & Photos) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Main Info Card */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Photos gallery */}
            <div className="bg-slate-50">
              {issue.images && issue.images.length > 0 ? (
                <div className={`grid ${issue.images.length > 1 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'} gap-1`}>
                  {issue.images.map((img, idx) => (
                    <img
                      key={idx}
                      src={`${import.meta.env.VITE_IMG_BASE_URL || 'http://localhost:5000'}/${img.replace(/\\/g, '/')}`}
                      alt={`Issue photo ${idx + 1}`}
                      className="w-full h-56 sm:h-64 object-cover hover:opacity-95 transition-opacity cursor-pointer"
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  ))}
                </div>
              ) : (
                <div className="h-40 sm:h-56 bg-slate-100 flex flex-col items-center justify-center text-slate-400">
                  <User className="w-10 h-10 mb-2 opacity-20" />
                  <p className="text-sm font-medium">No photos attached</p>
                </div>
              )}
            </div>

            <div className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-4 sm:mb-6">
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-slate-900">{issue.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium capitalize mt-1">{issue.category?.replace('-', ' ')}</p>
                </div>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider border shrink-0 ${statusStyles[issue.status] || 'bg-slate-100 text-slate-800'}`}>
                  {issue.status?.replace('-', ' ')}
                </span>
              </div>

              <div className="prose prose-slate max-w-none">
                <p className="text-sm sm:text-base text-slate-700 leading-relaxed">{issue.description}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 sm:mt-8 pt-6 border-t border-slate-100">
                <div className="flex items-start gap-3 text-slate-600">
                  <div className="bg-slate-100 p-1.5 rounded-lg shrink-0">
                    <MapPin className="w-4 h-4 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-tight mb-0.5">Location</p>
                    <p className="text-xs sm:text-sm font-medium line-clamp-2">{issue.location}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 text-slate-600">
                  <div className="bg-slate-100 p-1.5 rounded-lg shrink-0">
                    <Calendar className="w-4 h-4 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-tight mb-0.5">Reported On</p>
                    <p className="text-xs sm:text-sm font-medium">{new Date(issue.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</p>
                  </div>
                </div>
                {issue.reportedBy && (
                  <div className="flex items-start gap-3 text-slate-600">
                    <div className="bg-slate-100 p-1.5 rounded-lg shrink-0">
                      <User className="w-4 h-4 text-slate-500" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-tight mb-0.5">Reported By</p>
                      <p className="text-xs sm:text-sm font-medium truncate max-w-[200px]">{issue.reportedBy.name}</p>
                    </div>
                  </div>
                )}
                {issue.ward && (
                  <div className="flex items-start gap-3 text-slate-600">
                    <div className="bg-slate-100 p-1.5 rounded-lg shrink-0">
                      <Flag className="w-4 h-4 text-slate-500" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-tight mb-0.5">Target Ward</p>
                      <p className="text-xs sm:text-sm font-medium">{issue.ward}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (Map & Action Form) */}
        <div className="space-y-6 sm:space-y-8">
          
          {/* Map Location */}
          {issueLocation && (
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                <h3 className="font-bold text-slate-800 text-xs sm:text-sm flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-red-500" /> Incident Geospatial Data
                </h3>
              </div>
              <div className="h-[200px] sm:h-[250px] w-full relative z-0">
                <MapContainer center={issueLocation} zoom={15} style={{ height: "100%", width: "100%" }} zoomControl={false}>
                  <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                  <Marker position={issueLocation}>
                    <Popup>{issue.title}</Popup>
                  </Marker>
                </MapContainer>
              </div>
              <div className="p-3 bg-white border-t border-slate-100">
                <p className="text-[10px] text-slate-400 font-mono text-center">Lat: {issue.latitude.toFixed(6)} · Lng: {issue.longitude.toFixed(6)}</p>
              </div>
            </div>
          )}

          {/* Action Panel Form */}
          <div className="bg-brand-dark rounded-xl sm:rounded-2xl shadow-xl overflow-hidden border border-slate-700">
            <div className="p-5 border-b border-white/10">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Administrative Control</h3>
              <h2 className="text-lg font-bold text-white">Update Resolution Status</h2>
            </div>
            
            <form onSubmit={handleUpdate} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Workflow Phase</label>
                <select 
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-600 text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 p-3 text-sm transition-all"
                >
                  <option value="reported">Reported</option>
                  <option value="assigned">Assigned</option>
                  <option value="in-progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Resolution Notes</label>
                <textarea 
                  rows="3" 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-600 text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 p-3 text-sm transition-all mb-1" 
                  placeholder="Update on manpower or materials..." 
                />
              </div>

              {(newStatus === 'in-progress' || newStatus === 'resolved') && (
                <div className="animate-in fade-in slide-in-from-top-1">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Visual Proof (Optional)</label>
                  <input
                    id="status-image-upload"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => setImageFiles(Array.from(e.target.files))}
                    className="w-full bg-slate-900 border border-slate-600 text-slate-400 rounded-xl focus:ring-2 focus:ring-blue-500 p-2.5 text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-500 transition-all"
                  />
                  {imageFiles.length > 0 && (
                    <p className="mt-2 text-[10px] text-blue-400 font-bold">{imageFiles.length} item(s) staged for upload</p>
                  )}
                </div>
              )}

              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={updating}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-all shadow-lg text-sm uppercase tracking-widest"
                >
                  {updating ? (
                    <span className="flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2"></div>
                      Processing...
                    </span>
                  ) : 'Commit Changes'}
                </button>
              </div>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
}
