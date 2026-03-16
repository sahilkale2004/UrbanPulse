import React, { useState, useEffect } from 'react';
import { reportService } from '../services/api';
import { FileText, MapPin, Clock, AlertCircle, CheckCircle, Bell } from 'lucide-react';
import { motion } from 'framer-motion';

const statusStyles = {
  'reported': 'bg-red-100 text-red-800 border-red-200',
  'in-progress': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'resolved': 'bg-green-100 text-green-800 border-green-200',
  'closed': 'bg-slate-200 text-slate-800 border-slate-300'
};

const statusIcons = {
  'reported': <AlertCircle className="w-4 h-4 mr-1 text-red-600" />,
  'in-progress': <Clock className="w-4 h-4 mr-1 text-yellow-600" />,
  'resolved': <CheckCircle className="w-4 h-4 mr-1 text-green-600" />,
  'closed': <CheckCircle className="w-4 h-4 mr-1 text-slate-600" />
};

export default function MyReportsPage() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyIssues = async () => {
      try {
        // By default, the backend returns ONLY the citizen's own issues if we don't pass public=true
        const response = await reportService.getIssues();
        if (response && response.data) {
          // Sort by newest first
          const sorted = response.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          setIssues(sorted);
        }
      } catch (err) {
        console.error("Failed to load personal issues", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMyIssues();
  }, []);

  return (
    <div className="flex-1 bg-slate-50 min-h-[calc(100vh-64px)] pt-20 px-4 sm:px-6 lg:px-8 pb-12 w-full max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2 flex items-center">
          <FileText className="w-8 h-8 mr-3 text-blue-600" /> My Reports
        </h1>
        <p className="text-slate-600">Track the status of the civic issues you have submitted to the municipal authority.</p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : issues.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm">
          <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-slate-700 mb-2">No Reports Yet</h3>
          <p className="text-slate-500 max-w-md mx-auto">You haven't submitted any civic issues yet. When you report a problem, you'll be able to track its progress here.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {issues.map((issue, index) => (
            <motion.div 
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: index * 0.05 }}
              key={issue._id} 
              className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col md:flex-row"
            >
              {/* Image Section */}
              <div className="w-full md:w-64 h-48 md:h-auto shrink-0 bg-slate-100 flex items-center justify-center border-b md:border-b-0 md:border-r border-slate-200">
                {issue.images && issue.images.length > 0 ? (
                  <img src={`${import.meta.env.VITE_IMG_BASE_URL || 'http://localhost:5000'}/${issue.images[0].replace(/\\/g, '/')}`} alt={issue.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-slate-400 flex flex-col items-center">
                    <FileText className="w-8 h-8 mb-2 opacity-50" />
                    <span className="text-xs font-medium uppercase tracking-wider">No Photo</span>
                  </div>
                )}
              </div>

              {/* Details Section */}
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex flex-wrap gap-2 justify-between items-start mb-2">
                    <h3 className="text-lg font-bold text-slate-900 capitalize">{issue.title || issue.category}</h3>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${statusStyles[issue.status] || 'bg-slate-100 text-slate-800'}`}>
                      {statusIcons[issue.status]}
                      {issue.status.replace('-', ' ')}
                    </span>
                  </div>
                  
                  <p className="text-slate-600 text-sm mb-4 line-clamp-2">{issue.description}</p>
                  
                  <div className="flex items-center text-sm text-slate-500 mb-2">
                    <MapPin className="w-4 h-4 mr-2 text-slate-400 shrink-0" />
                    <span className="truncate">{issue.location}</span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center text-xs text-slate-400 font-medium">
                  <span>Reported on: {new Date(issue.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  <span>ID: {issue._id.substring(issue._id.length - 8).toUpperCase()}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
