import React, { useState, useRef, useEffect } from 'react';
import { Camera, MapPin, UploadCloud, CheckCircle, Navigation, X, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import exifr from 'exifr';
import { reportService } from '../services/api';

export default function CitizenReportPage() {
  const [formData, setFormData] = useState({
    issueType: '',
    description: '',
    location: '',
    ward: '',
    latitude: null,
    longitude: null,
    photos: [],
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [isClassifying, setIsClassifying] = useState(false);
  const [aiDetectedType, setAiDetectedType] = useState('');
  
  // Camera state
  const [showCamera, setShowCamera] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);

  const issueTypes = [
    "Pothole",
    "Waterlogging",
    "Drainage Blockage",
    "Broken Streetlight",
    "Garbage Overflow"
  ];

  // Refactored camera attachment logic: 
  // Ensures stream is attached even if video element renders slightly after state change
  useEffect(() => {
    if (showCamera && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      // Some mobile browsers require explicit play() call
      videoRef.current.play().catch(e => console.warn("Auto-play prevented:", e));
    }
  }, [showCamera, stream]);

  const handleGpsDetect = async (specificPhoto = null) => {
    setGpsLoading(true);
    let coords = null;

    try {
      // 1. Try to get EXIF data first if a specific photo or existing photos exist
      const photoToAnalyze = specificPhoto || (formData.photos && formData.photos.length > 0 ? formData.photos[0] : null);
      if (photoToAnalyze) {
        const gpsData = await exifr.gps(photoToAnalyze);
        if (gpsData && gpsData.latitude && gpsData.longitude) {
          coords = { latitude: gpsData.latitude, longitude: gpsData.longitude };
        }
      }
    } catch (err) {
      console.log("No EXIF data or error extracting:", err);
    }

    // 2. Fallback to browser geolocation if no EXIF
    if (!coords) {
      try {
        coords = await new Promise((resolve, reject) => {
          if (!navigator.geolocation) {
             reject(new Error("Geolocation is not supported by your browser"));
          } else {
             navigator.geolocation.getCurrentPosition(
               (position) => resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
               (error) => reject(error),
               { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
             );
          }
        });
      } catch (err) {
        console.error("Browser geolocation error:", err);
        // Silent failure if triggered by camera capture, otherwise alert
        if (!specificPhoto) alert("Could not detect location. Please ensure location services are enabled.");
        setGpsLoading(false);
        return;
      }
    }

    // 3. Reverse geocoding using Nominatim
    if (coords) {
      const { latitude, longitude } = coords;
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
        const data = await response.json();
        
        if (data && data.display_name) {
          setFormData(prev => ({ ...prev, location: data.display_name, latitude, longitude }));
        } else {
          setFormData(prev => ({ ...prev, location: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`, latitude, longitude }));
        }
      } catch (err) {
        console.error("Reverse geocoding failed", err);
        setFormData(prev => ({ ...prev, location: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`, latitude, longitude }));
      }
    }
    
    setGpsLoading(false);
  };

  const runAiClassification = async (file) => {
    setIsClassifying(true);
    try {
      const aiFormData = new FormData();
      aiFormData.append("file", file);

      const aiBaseUrl = import.meta.env.VITE_AI_URL || "http://localhost:8000";

      const response = await fetch(`${aiBaseUrl}/ai/classify`, {
        method: "POST",
        body: aiFormData
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data && Array.isArray(data) && data.length > 0) {
          const labelsText = data.slice(0, 3).map(d => d.label?.toLowerCase() || '').join(' ');
          
          let detectedType = '';
          if (labelsText.includes('pothole') || labelsText.includes('road') || labelsText.includes('crack') || labelsText.includes('hole')) {
            detectedType = 'Pothole';
            // Trigger Roboflow pothole detection silently in the background
            fetch(`${aiBaseUrl}/ai/detect-pothole`, {
              method: "POST",
              body: aiFormData
            }).then(res => res.json())
              .then(rfData => console.log("🤖 Roboflow Detection Result:", rfData))
              .catch(err => console.warn("Roboflow background detection:", err));
          } else if (labelsText.includes('water') || labelsText.includes('flood') || labelsText.includes('rain') || labelsText.includes('puddle')) {
            detectedType = 'Waterlogging';
          } else if (labelsText.includes('drain') || labelsText.includes('sewer') || labelsText.includes('clog')) {
            detectedType = 'Drainage Blockage';
          } else if (labelsText.includes('light') || labelsText.includes('lamp') || labelsText.includes('street')) {
            detectedType = 'Broken Streetlight';
          } else if (labelsText.includes('garbage') || labelsText.includes('trash') || labelsText.includes('waste')) {
            detectedType = 'Garbage Overflow';
          }
          
          if (detectedType) {
            setFormData(prev => ({ ...prev, issueType: detectedType }));
            setAiDetectedType(detectedType);
          }
        }
      }
    } catch (error) {
      console.error("AI Classification failed", error);
    } finally {
      setIsClassifying(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files || files.length === 0) return;
    const selectedFiles = files.slice(0, 2);
    setFormData(prev => ({ ...prev, photos: selectedFiles }));
    setAiDetectedType('');
    runAiClassification(selectedFiles[0]);
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' }, 
        audio: false 
      });
      setStream(mediaStream);
      setShowCamera(true);
    } catch (err) {
      console.error("Camera access denied", err);
      alert("Could not access camera. Please ensure permissions are granted.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    canvas.toBlob((blob) => {
      const capturedFile = new File([blob], `capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
      
      // Update form data
      setFormData(prev => ({ 
        ...prev, 
        photos: [...prev.photos, capturedFile].slice(0, 2) 
      }));
      
      // Auto geo-tag and classify
      handleGpsDetect(capturedFile);
      runAiClassification(capturedFile);
      
      stopCamera();
    }, 'image/jpeg', 0.95);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const categoryMap = {
        'Pothole': 'pothole',
        'Waterlogging': 'waterlogging',
        'Drainage Blockage': 'drainage',
        'Broken Streetlight': 'streetlight',
        'Garbage Overflow': 'garbage'
      };

      const submitData = new FormData();
      submitData.append('title', `${formData.issueType} Reported`);
      submitData.append('description', formData.description);
      submitData.append('category', categoryMap[formData.issueType] || 'other');
      submitData.append('ward', formData.ward || 'Ward 1');
      submitData.append('location', formData.location);
      
      const finalLat = formData.latitude || 19.0760;
      const finalLng = formData.longitude || 72.8777;
      submitData.append('latitude', finalLat);
      submitData.append('longitude', finalLng);

      if (formData.photos && formData.photos.length > 0) {
        formData.photos.forEach(photo => {
          submitData.append('images', photo);
        });
      }

      await reportService.submitReport(submitData);
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setFormData({ issueType: '', description: '', location: '', ward: '', latitude: null, longitude: null, photos: [] });
      }, 5000);
    } catch (err) {
      console.error(err);
      alert("Error submitting report. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-grow pt-20 px-4 pb-12 w-full max-w-lg mx-auto md:max-w-2xl">
      
      {/* Camera Modal Overlay */}
      <AnimatePresence>
        {showCamera && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] bg-black flex flex-col items-center justify-center"
          >
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className="w-full h-full object-cover" 
            />
            <canvas ref={canvasRef} className="hidden" />
            
            <div className="absolute bottom-10 left-0 right-0 flex justify-around items-center px-10">
              <button onClick={stopCamera} className="p-4 bg-white/20 backdrop-blur-md rounded-full text-white">
                <X className="w-6 h-6" />
              </button>
              <button onClick={capturePhoto} className="w-20 h-20 bg-white rounded-full border-[6px] border-white/30 flex items-center justify-center shadow-2xl active:scale-95 transition-transform">
                <div className="w-14 h-14 bg-blue-600 rounded-full" />
              </button>
              <div className="w-10" /> {/* Spacer */}
            </div>
            <p className="absolute top-10 text-white font-bold bg-black/40 px-4 py-2 rounded-full backdrop-blur-sm">Align incident in frame</p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mb-6 sm:mb-8 text-center sm:text-left">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Report a Civic Issue</h1>
        <p className="text-sm sm:text-base text-slate-600 font-medium">Help us improve your city by reporting infrastructure problems.</p>
      </div>

      <AnimatePresence mode="wait">
        {submitted ? (
          <motion.div 
            key="success"
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="bg-green-50 border border-green-200 rounded-3xl p-6 sm:p-10 text-center shadow-lg"
          >
            <div className="mx-auto flex items-center justify-center w-16 h-16 bg-green-100 rounded-2xl mb-6">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-3">Report Submitted!</h2>
            <p className="text-slate-600 mb-8 max-w-sm mx-auto leading-relaxed">Thank you. Mumbai municipal authorities will review your report shortly.</p>
            <button 
              onClick={() => { setSubmitted(false); setFormData({ issueType: '', description: '', location: '', ward: '', latitude: null, longitude: null, photos: [] }); }}
              className="w-full sm:w-auto bg-green-600 text-white font-bold py-3.5 px-8 rounded-2xl hover:bg-green-700 transition-all shadow-md active:scale-95"
            >
              File Another Report
            </button>
          </motion.div>
        ) : (
          <motion.div 
            key="form"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="bg-white shadow-2xl border border-slate-100 rounded-3xl p-5 sm:p-10"
          >
            <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
              
              {/* Issue Type */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center justify-between">
                  <span>Incident Category</span>
                  {aiDetectedType && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full border border-blue-200 animate-pulse">
                      🤖 AI Suggested: {aiDetectedType}
                    </span>
                  )}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {issueTypes.map(type => (
                    <div 
                      key={type}
                      onClick={() => setFormData({ ...formData, issueType: type })}
                      className={`cursor-pointer px-4 py-3 rounded-xl border-2 transition-all flex items-center justify-center text-xs sm:text-sm font-bold
                        ${formData.issueType === type ? 'border-blue-600 bg-blue-100 text-blue-800 shadow-md' : 'border-slate-100 bg-slate-50 hover:bg-slate-100 text-slate-600 hover:border-slate-300'}
                      `}
                    >
                      {type}
                    </div>
                  ))}
                </div>
              </div>

              {/* Photo Section */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Capture Evidence (Required)</label>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Camera Button for Mobile - Hide on lg (above 1024px) */}
                  <button 
                    type="button"
                    onClick={startCamera}
                    className="lg:hidden flex-1 bg-blue-600 active:bg-blue-700 text-white p-5 sm:p-6 rounded-2xl flex flex-col items-center justify-center gap-3 shadow-lg shadow-blue-200 group transition-all"
                  >
                    <div className="p-3 bg-white/20 rounded-xl group-hover:scale-110 transition-transform">
                      <Camera className="w-7 h-7 sm:w-8 sm:h-8" />
                    </div>
                    <span className="text-xs sm:text-sm font-black uppercase tracking-wider">Take Live Photo</span>
                    <span className="text-[10px] opacity-80 font-bold">Auto-tags Location</span>
                  </button>

                  {/* Standard Upload for PC/Gallery - Full width on lg */}
                  <div 
                    onClick={() => document.getElementById('file-upload').click()}
                    className="flex-1 border-2 border-slate-200 border-dashed rounded-2xl bg-slate-50 hover:bg-slate-100 cursor-pointer transition-all flex flex-col items-center justify-center p-5 sm:p-6 group"
                  >
                    <input id="file-upload" type="file" multiple className="sr-only" onChange={handlePhotoUpload} accept="image/*" />
                    <UploadCloud className="w-8 h-8 sm:w-10 sm:h-10 text-slate-300 group-hover:text-blue-500 mb-2 transition-colors" />
                    <span className="text-xs sm:text-sm font-bold text-slate-600">Upload Gallery</span>
                    <span className="text-[10px] text-slate-400 mt-1">Select from {showCamera ? 'gallery' : 'computer'}</span>
                  </div>
                </div>

                {formData.photos.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {formData.photos.map((p, idx) => (
                      <div key={idx} className="bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold text-blue-700 flex items-center gap-2">
                        <CheckCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> <span className="truncate max-w-[100px] sm:max-w-none">{p.name || `photo_${idx+1}.jpg`}</span>
                      </div>
                    ))}
                    <button type="button" onClick={() => setFormData(p => ({...p, photos: []}))} className="text-[10px] text-red-500 font-bold underline px-2">Clear All</button>
                  </div>
                )}

                {isClassifying && (
                  <div className="mt-3 flex items-center gap-2 text-[10px] sm:text-xs font-bold text-amber-600 animate-pulse bg-amber-50 p-2.5 rounded-xl border border-amber-100">
                     <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> AI analyzing image...
                  </div>
                )}
              </div>

              {/* Location & Details Area */}
              <div className="space-y-6">
                <div>
                   <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex flex-wrap items-center justify-between gap-2">
                     <span>Street Address / Landmarks</span>
                     <button type="button" onClick={() => handleGpsDetect()} className="text-[10px] text-blue-600 flex items-center gap-1 font-black underline uppercase active:scale-95 transition-transform">
                       <Navigation className="w-3 h-3" /> Update GPS
                     </button>
                   </label>
                   <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <input 
                        type="text" required
                        value={formData.location}
                        onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                        className="w-full pl-12 pr-4 py-3.5 sm:py-4 border border-slate-200 rounded-2xl bg-slate-50 text-slate-700 font-bold focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm outline-none" 
                        placeholder={gpsLoading ? "Detecting location..." : "e.g. Near Bus Stand, MG Road"}
                      />
                      {gpsLoading && <div className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>}
                   </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">City Ward</label>
                    <select
                      required
                      value={formData.ward}
                      onChange={(e) => setFormData(prev => ({ ...prev, ward: e.target.value }))}
                      className="block w-full px-4 py-3.5 sm:py-4 border border-slate-200 rounded-2xl bg-slate-50 text-slate-700 font-bold focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    >
                      <option value="">Select Ward</option>
                      {Array.from({ length: 24 }, (_, i) => (
                        <option key={i + 1} value={`Ward ${i + 1}`}>Ward {i + 1}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center justify-between">
                      <span>Coordinates</span>
                      <span className="text-[8px] opacity-70 border-b border-dotted" title="Captured via GPS">GPS FIXED</span>
                    </label>
                    <div className="h-[52px] sm:h-[60px] px-4 rounded-2xl bg-slate-100 flex items-center text-[10px] sm:text-xs font-mono text-slate-500 overflow-hidden truncate">
                      {formData.latitude ? `${formData.latitude.toFixed(5)}, ${formData.longitude.toFixed(5)}` : "No GPS data"}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Additional Details</label>
                  <textarea 
                    required rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 text-slate-700 font-medium focus:ring-2 focus:ring-blue-500 outline-none text-sm placeholder:text-[12px] sm:placeholder:text-sm" 
                    placeholder="Briefly describe the severity or duration of the issue..." 
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button 
                type="submit" 
                disabled={isSubmitting || !formData.issueType || formData.photos.length === 0}
                className="w-full flex justify-center items-center py-4 sm:py-5 px-6 rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-black text-xs sm:text-sm uppercase tracking-[0.2em] transition-all shadow-xl hover:shadow-blue-200 active:scale-[0.98]"
              >
                {isSubmitting ? 'Uploading Report...' : 'Confirm Submission'}
              </button>

            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
