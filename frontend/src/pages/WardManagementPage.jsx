import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, ChevronLeft, ChevronRight, MoreVertical, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { reportService } from '../services/api';

const statusStyles = {
  'reported': 'bg-red-50 text-red-700 border-red-100',
  'assigned': 'bg-blue-50 text-blue-700 border-blue-100',
  'progress': 'bg-amber-50 text-amber-700 border-amber-100',
  'resolved': 'bg-green-50 text-green-700 border-green-100'
};

export default function WardManagementPage() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState({
    status: '',
    category: '',
    ward: ''
  });

  const fetchIssues = async () => {
    setLoading(true);
    try {
      const response = await reportService.getIssues();
      setIssues(response.data || []);
    } catch (error) {
      console.error("Failed to fetch issues", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, []);

  const assignTask = async (issueId) => {
    try {
      const res = await reportService.updateIssue(issueId, { status: 'assigned' });
      if (res.success) {
        setIssues(prev => prev.map(i => i._id === issueId ? { ...i, status: 'assigned' } : i));
      }
    } catch (err) {
      alert('Failed to assign task.');
    }
  };

  // 📝 Intelligent Filtering Logic
  const filteredIssues = useMemo(() => {
    return issues.filter(issue => {
      const matchesSearch = 
        (issue.title?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (issue.category?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (issue.location?.toLowerCase() || '').includes(searchQuery.toLowerCase());
      
      const matchesStatus = !activeFilters.status || issue.status === activeFilters.status;
      const matchesCategory = !activeFilters.category || issue.category === activeFilters.category;
      const matchesWard = !activeFilters.ward || issue.ward === activeFilters.ward;

      return matchesSearch && matchesStatus && matchesCategory && matchesWard;
    });
  }, [issues, searchQuery, activeFilters]);

  // Derived options for filters
  const categories = [...new Set(issues.map(i => i.category))].filter(Boolean);
  const wards = [...new Set(issues.map(i => i.ward))].filter(Boolean);

  return (
    <div className="flex-1 bg-slate-50 min-h-screen pt-20 px-4 sm:px-6 lg:px-8 pb-12 w-full max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Ward Management Panel</h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">Real-time oversight of reported civic incidents.</p>
        </div>
        {(searchQuery || activeFilters.status || activeFilters.category || activeFilters.ward) && (
          <button 
            onClick={() => { setSearchQuery(''); setActiveFilters({ status: '', category: '', ward: '' }); }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-200 text-slate-600 rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-slate-300 transition-colors"
          >
            <X className="w-3.5 h-3.5" /> Clear All Filters
          </button>
        )}
      </div>

      {/* Main Panel Container */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-200 flex flex-col lg:flex-row gap-4 justify-between items-center bg-white">
          {/* Search */}
          <div className="relative w-full lg:w-96">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-slate-400" />
            </div>
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg text-sm bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm" 
              placeholder="Search by title, category, or area..." 
            />
          </div>

          {/* Functional Select Filters */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            {/* Status Filter */}
            <select 
              value={activeFilters.status}
              onChange={(e) => setActiveFilters(prev => ({ ...prev, status: e.target.value }))}
              className="px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 outline-none transition-colors"
            >
              <option value="">Status: All</option>
              <option value="reported">Reported</option>
              <option value="assigned">Assigned</option>
              <option value="progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>

            {/* Type Filter */}
            <select 
              value={activeFilters.category}
              onChange={(e) => setActiveFilters(prev => ({ ...prev, category: e.target.value }))}
              className="px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 outline-none transition-colors"
            >
              <option value="">Category: All</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat.replace('-', ' ').toUpperCase()}</option>
              ))}
            </select>

            {/* Ward Filter */}
            <select 
              value={activeFilters.ward}
              onChange={(e) => setActiveFilters(prev => ({ ...prev, ward: e.target.value }))}
              className="px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 outline-none transition-colors"
            >
              <option value="">Ward: All</option>
              {wards.map(w => (
                <option key={w} value={w}>{w}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table Wrapper */}
        <div className="overflow-x-auto relative">
          <table className="min-w-full divide-y divide-slate-200 text-left">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest min-w-[200px]">Incident Details</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest min-w-[120px]">Evidence</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Date Reported</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Phase</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Control</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                       <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                       <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Polling Database...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredIssues.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-16 text-center">
                    <p className="text-sm font-bold text-slate-400">No issues found matching your selection.</p>
                    <button onClick={() => { setSearchQuery(''); setActiveFilters({ status: '', category: '', ward: '' }); }} className="text-blue-600 text-[10px] font-black uppercase mt-2 underline">Reset filters</button>
                  </td>
                </tr>
              ) : (
                filteredIssues.map((row) => (
                  <tr key={row._id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <Link to={`/issue/${row._id}`} className="block">
                        <span className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-1">{row.title || row.category?.replace('-', ' ')}</span>
                        <div className="flex items-center gap-2 mt-1">
                           <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{row.ward}</p>
                           <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                           <p className="text-[10px] text-slate-500 font-medium truncate max-w-[150px]">{row.location}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {row.images && row.images.length > 0 ? (
                        <div className="flex -space-x-4">
                          {row.images.slice(0, 2).map((img, idx) => (
                            <img
                              key={idx}
                              src={`${import.meta.env.VITE_IMG_BASE_URL || 'http://localhost:5000'}/${img.replace(/\\/g, '/')}`}
                              alt="Proof"
                              className="h-10 w-14 object-cover rounded border-2 border-white shadow-sm bg-slate-100"
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Missing Proof</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-xs font-bold text-slate-600">{new Date(row.createdAt).toLocaleDateString()}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{new Date(row.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${statusStyles[row.status] || 'bg-slate-100 text-slate-800'}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                       <div className="flex items-center justify-end space-x-2">
                          <button 
                            onClick={() => assignTask(row._id)}
                            disabled={row.status !== 'reported'}
                            className="h-8 bg-blue-600 hover:bg-blue-700 disabled:opacity-30 disabled:cursor-not-allowed text-white px-4 rounded-lg shadow-sm transition-all text-[10px] font-black uppercase tracking-widest active:scale-95"
                          >
                            {row.status === 'assigned' ? 'Hired' : 'Assign'}
                          </button>
                          <Link to={`/issue/${row._id}`} className="h-8 w-8 bg-white hover:bg-slate-50 text-slate-400 hover:text-slate-600 border border-slate-200 flex items-center justify-center rounded-lg transition-colors shadow-sm">
                             <MoreVertical className="w-4 h-4" />
                          </Link>
                       </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Info Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.1em]">
            Records: <span className="text-slate-900">{filteredIssues.length}</span> / {issues.length} total
          </div>
          <div className="flex items-center gap-1">
             <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
             <span className="text-[10px] font-black text-slate-400 uppercase">Live Database Sync</span>
          </div>
        </div>

      </div>
    </div>
  );
}
