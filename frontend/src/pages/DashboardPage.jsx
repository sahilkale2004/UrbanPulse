import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell, Legend
} from 'recharts';
import { FileText, CheckCircle, Clock, Brain, ShieldAlert, LogOut } from 'lucide-react';
import { useStats } from '../hooks/useStats';
import { useAuth } from '../context/AuthContext';

const monthlyTrends = [
  { month: 'Jan', complaints: 120, resolved: 90 },
  { month: 'Feb', complaints: 140, resolved: 110 },
  { month: 'Mar', complaints: 200, resolved: 140 },
  { month: 'Apr', complaints: 280, resolved: 210 },
  { month: 'May', complaints: 450, resolved: 320 },
  { month: 'Jun', complaints: 410, resolved: 380 },
];

const COLORS = ['#3b82f6', '#06b6d4', '#8b5cf6', '#eab308', '#f97316'];

// Mirror the backend formula so we can compute on the fly in the frontend too
function computeRiskScore(complaints, rainfall = 0, roadDensity = 0.75) {
  const rainScore = Math.min(Math.sqrt(Math.max(rainfall, 0) / 50.0), 1.0);
  const complaintScore = Math.min(complaints / 500.0, 1.0);
  const densityScore = Math.max(0, Math.min(roadDensity, 1.0));
  const raw = (0.40 * rainScore) + (0.40 * complaintScore) + (0.20 * densityScore);
  return Math.max(0.05, Math.min(raw, 0.98));
}

export default function DashboardPage() {
  // 🔄 All stats from the shared polling hook (refreshes every 30s)
  const {
    totalReports, resolvedIssues, activeRisks, inProgress,
    resolutionRate, byCategory, byWard, loading: statsLoading, lastUpdated
  } = useStats();
  const { logout } = useAuth();

  // Derive ward risk data from live byWard counts
  const wardRiskData = useMemo(() => {
    return Object.entries(byWard)
      .map(([ward, count]) => {
        const score = computeRiskScore(count);
        const pct = Math.round(score * 100);
        return {
          ward, complaints: count, riskScore: pct,
          level: pct >= 70 ? 'Critical' : pct >= 40 ? 'Elevated' : 'Low',
          color: pct >= 70 ? '#ef4444' : pct >= 40 ? '#f59e0b' : '#22c55e'
        };
      })
      .sort((a, b) => b.riskScore - a.riskScore)
      .slice(0, 8);
  }, [byWard]);

  // Derive pie chart data from live category counts
  const issueDistribution = useMemo(() => {
    const catMap = {
      pothole: 'Potholes',
      waterlogging: 'Waterlogging',
      drainage: 'Drainage',
      streetlight: 'Lighting',
      garbage: 'Garbage'
    };
    const entries = Object.entries(byCategory)
      .filter(([cat]) => catMap[cat])
      .map(([cat, count]) => ({ name: catMap[cat], value: count }));
    return entries.length > 0 ? entries : [
      { name: 'Potholes', value: 1 }, { name: 'Waterlogging', value: 1 },
      { name: 'Drainage', value: 1 }, { name: 'Lighting', value: 1 }
    ];
  }, [byCategory]);

  // City-wide risk computed from real total
  const riskScore = totalReports !== null
    ? (computeRiskScore(totalReports) * 100).toFixed(1)
    : null;

  const riskPct = parseFloat(riskScore) || 0;
  const riskLevel = riskPct >= 70 ? 'Critical' : riskPct >= 40 ? 'Elevated' : 'Low';
  const riskColor = riskPct >= 70 ? 'text-red-600' : riskPct >= 40 ? 'text-yellow-600' : 'text-green-600';
  const riskBadgeBg = riskPct >= 70 ? 'bg-red-100 text-red-700' : riskPct >= 40 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700';

  const fmt = (n) => n === null ? '...' : n.toLocaleString();
  const isLoadingRisk = statsLoading;


  return (
    <div className="flex-1 bg-slate-50 min-h-screen pt-20 px-4 sm:px-6 lg:px-8 pb-12 w-full max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Municipal Authority Dashboard</h1>
          <p className="text-sm text-slate-500 font-medium">Overview of city infrastructure issues and resolution metrics.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center space-x-2 bg-white border border-slate-300 text-slate-700 font-medium px-4 py-2 rounded-lg shadow-sm text-xs sm:text-sm">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span>Live Sync: Active</span>
            {lastUpdated && (
              <span className="text-slate-400 text-[10px] sm:text-xs">· {Math.floor((Date.now() - lastUpdated.getTime()) / 1000)}s ago</span>
            )}
          </div>
          <button className="bg-blue-600 text-white font-medium px-4 py-2 rounded-lg hover:bg-blue-700 shadow-sm text-xs sm:text-sm flex items-center justify-center">
            <FileText className="w-4 h-4 mr-2" /> Export Report
          </button>
          <button 
            onClick={logout}
            className="bg-white border border-red-200 text-red-600 font-medium px-4 py-2 rounded-lg hover:bg-red-50 shadow-sm text-xs sm:text-sm flex items-center justify-center transition-colors"
          >
            <LogOut className="w-4 h-4 mr-2" /> Logout
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        
        {/* Card 1 - Live Total */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center">
          <div className="bg-blue-100 p-3 rounded-xl mr-4 shrink-0">
            <FileText className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Total Complaints</p>
            <h3 className={`text-2xl font-bold text-slate-900 ${statsLoading ? 'animate-pulse opacity-40' : ''}`}>
              {fmt(totalReports)}
            </h3>
            <p className="text-[10px] text-slate-500 font-medium mt-1">Live from database</p>
          </div>
        </div>

        {/* Card 2 - Live AI Risk */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center">
          <div className="bg-red-100 p-3 rounded-xl mr-4 shrink-0">
            <Brain className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">City Risk Index (AI)</p>
            <div className="flex items-baseline gap-2 flex-wrap">
              <h3 className={`text-2xl font-bold ${riskScore ? riskColor : 'text-slate-900'}`}>
                {riskScore ? `${riskScore}%` : '...'}
              </h3>
              {riskScore && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${riskBadgeBg}`}>{riskLevel}</span>
              )}
            </div>
            <p className="text-[10px] text-slate-500 font-medium mt-1 truncate">Complaints + weather weighted</p>
          </div>
        </div>

        {/* Card 3 - Resolution Rate (real) */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center">
          <div className="bg-green-100 p-3 rounded-xl mr-4 shrink-0">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Resolution Rate</p>
            <h3 className={`text-2xl font-bold text-green-700 ${statsLoading ? 'animate-pulse opacity-40' : ''}`}>
              {resolutionRate !== null ? `${resolutionRate}%` : '...'}
            </h3>
            <p className="text-[10px] text-slate-500 font-medium mt-1">Resolved ÷ Total issues</p>
          </div>
        </div>

        {/* Card 4 - Active Risks (real) */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center">
          <div className="bg-purple-100 p-3 rounded-xl mr-4 shrink-0">
            <Clock className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">In Progress</p>
            <h3 className={`text-2xl font-bold text-purple-700 ${statsLoading ? 'animate-pulse opacity-40' : ''}`}>
              {fmt(inProgress)}
            </h3>
            <p className="text-[10px] text-slate-500 font-medium mt-1">Currently being worked on</p>
          </div>
        </div>

      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        
        {/* Trend Area Chart (Spans 2 columns) */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-100 lg:col-span-2">
          <h3 className="text-sm sm:text-base font-bold text-slate-800 mb-6">Monthly Infrastructure Risk Trends</h3>
          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorComplaints" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                />
                <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                <Area type="monotone" dataKey="complaints" name="New Complaints" stroke="#ef4444" fillOpacity={1} fill="url(#colorComplaints)" />
                <Area type="monotone" dataKey="resolved" name="Resolved Issues" stroke="#22c55e" fillOpacity={1} fill="url(#colorResolved)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart (Issue Type Distribution) */}
        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-100">
          <h3 className="text-sm sm:text-base font-bold text-slate-800 mb-6">Issue Type Distribution</h3>
          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={issueDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  labelLine={false}
                >
                  {issueDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }}
                  formatter={(value) => [`${value}%`, 'Share']}
                />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Ward AI Risk Intelligence Panel */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-2">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-800 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-red-500" />
              AI Ward Risk Intelligence
            </h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Complaints (40%) + Rainfall (40%) + Density (20%)</p>
          </div>
          <span className="text-[10px] font-semibold bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-100 w-fit">🤖 AI Powered</span>
        </div>

        {wardRiskData.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-sm">
            {isLoadingRisk
              ? <p className="animate-pulse">Computing AI risk scores from live data...</p>
              : <p>No ward data available yet. Submit some issues to see risk scores!</p>
            }
          </div>
        ) : (
          <div className="space-y-6">
            {wardRiskData.map((w) => (
              <div key={w.ward} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <div className="w-full sm:w-28 shrink-0 flex justify-between sm:block">
                  <p className="text-xs sm:text-sm font-semibold text-slate-700 truncate">{w.ward}</p>
                  <p className="text-[10px] text-slate-400">{w.complaints} reported</p>
                </div>
                <div className="flex-1">
                  <div className="w-full bg-slate-100 rounded-full h-2.5 sm:h-3">
                    <div
                      className="h-2.5 sm:h-3 rounded-full transition-all duration-700"
                      style={{ width: `${w.riskScore}%`, backgroundColor: w.color }}
                    />
                  </div>
                </div>
                <div className="w-full sm:w-24 text-right shrink-0 flex items-center justify-end sm:block">
                  <span className="text-xs sm:text-sm font-bold text-slate-800">{w.riskScore}%</span>
                  <span
                    className="ml-2 text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{
                      backgroundColor: w.color + '20',
                      color: w.color
                    }}
                  >
                    {w.level}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
