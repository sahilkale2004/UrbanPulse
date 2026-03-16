import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Activity, AlertTriangle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useStats } from '../hooks/useStats';

export default function LandingPage() {
  const { isAuthenticated, role } = useAuth();
  const { totalReports, resolvedIssues, activeRisks, loading, lastUpdated } = useStats();

  const fmt = (n) => n === null ? '...' : n.toLocaleString();

  const stats = [
    {
      icon: <Activity className="w-8 h-8 text-white" />,
      title: "Total Reports",
      value: fmt(totalReports),
      desc: "Issues Registered in Database",
      color: "bg-brand-dark"
    },
    {
      icon: <ShieldCheck className="w-8 h-8 text-brand-light" />,
      title: "Resolved Issues",
      value: fmt(resolvedIssues),
      desc: "Efficiently Addressed",
      color: "bg-brand-dark"
    },
    {
      icon: <AlertTriangle className="w-8 h-8 text-red-400" />,
      title: "Active Risks",
      value: fmt(activeRisks),
      desc: "Urgent Unactioned Reports",
      color: "bg-brand-dark"
    }
  ];

  const challenges = [
    { title: "Potholes & Road Damage", desc: "Identify and track road infrastructure repairs for safer commutes.", icon: "🛣️" },
    { title: "Waterlogging & Drainage", desc: "Report blockages to prevent flooding and ensure efficient water management.", icon: "🌊" },
    { title: "Waste Management Issues", desc: "Streamline waste collection and improve city cleanliness.", icon: "🗑️" },
    { title: "Street Lighting & Safety", desc: "Ensure well-lit streets and public areas for enhanced security.", icon: "💡" }
  ];

  return (
    <div className="flex-grow flex flex-col pt-16">
      
      {/* Hero Section */}
      <section className="relative bg-brand-dark text-white shadow-2xl overflow-hidden min-h-[500px] flex flex-col justify-center rounded-b-3xl mx-4 sm:mx-6 lg:mx-8 mt-4">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_90%,#C6F9F1_0%,#8EF6E4_40%,#0B1A30_60%,#0B1A30_100%)] opacity-80 mix-blend-overlay"></div>
        <div className="relative z-10 px-6 sm:px-8 py-16 md:py-24 max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between w-full h-full min-h-[500px]">
          <div className="max-w-3xl md:w-1/2 flex flex-col justify-center">
            <motion.h1 
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6 text-white text-center md:text-left"
            >
              UrbanPulse: Empowering Indian Cities. shaping a Smarter Future.
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }}
              className="text-slate-300 font-medium text-base sm:text-lg md:text-xl mb-10 max-w-lg leading-relaxed text-center md:text-left mx-auto md:ml-0"
            >
              Connect with your municipal authorities, report civic issues, and monitor real-time city data for a better urban life.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
              className="flex flex-wrap gap-4 justify-center md:justify-start"
            >
              {isAuthenticated ? (
                 role !== 'authority' && (
                   <Link to="/report" className="flex items-center bg-brand-light text-brand-dark px-6 py-3 rounded-full font-semibold hover:bg-teal-300 transition-colors shadow-lg">
                     Report Civic Issue <ArrowRight className="w-5 h-5 ml-2" />
                   </Link>
                 )
              ) : (
                 <Link to="/login" className="flex items-center bg-brand-light text-brand-dark px-6 py-3 rounded-full font-semibold hover:bg-teal-300 transition-colors shadow-lg">
                   Get Started to Report <ArrowRight className="w-5 h-5 ml-2" />
                 </Link>
              )}
              
              <Link to={role === 'authority' ? "/dashboard" : "/map"} className="flex items-center bg-brand-dark border border-brand-light text-white px-6 py-3 rounded-full font-semibold hover:bg-brand-dark/80 transition-colors backdrop-blur-sm">
                {role === 'authority' ? 'Go to Dashboard' : 'View City Map'}
              </Link>
            </motion.div>
          </div>

          {/* Hero Image */}
          <motion.div 
            initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.3 }}
            className="hidden lg:flex lg:w-1/2 mt-12 md:mt-0 lg:pl-10 items-center justify-center h-full"
          >
            <img 
              src="/Hero-image.png" 
              alt="UrbanPulse Dashboard Interface" 
              className="w-full h-auto object-contain drop-shadow-2xl rounded-xl transform hover:scale-[1.02] transition-transform duration-500" 
            />
          </motion.div>
        </div>
      </section>

      {/* Quick Statistics Section */}
      <section className="px-4 sm:px-6 lg:px-8 mt-[-3rem] sm:mt-[-4rem] relative z-20">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.3 }}
            className="bg-white rounded-2xl p-4 sm:p-6 shadow-xl border border-slate-100"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              {stats.map((stat, idx) => (
                <div key={idx} className="flex items-center p-4 border-2 border-brand-accent rounded-xl bg-white shadow-sm hover:shadow-md transition-shadow">
                  <div className={`${stat.color} p-2.5 sm:p-3 rounded-lg mr-4 shrink-0`}>
                    {stat.icon}
                  </div>
                  <div>
                    <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{stat.title}</p>
                    <h3 className={`text-xl sm:text-2xl font-extrabold text-slate-900 transition-all ${loading ? 'opacity-40 animate-pulse' : ''}`}>
                      {stat.value}
                    </h3>
                    <p className="text-[10px] sm:text-xs text-slate-600 truncate">{stat.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            {/* Live indicator */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-center sm:justify-end gap-2 text-center sm:text-right">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-50 px-2.5 py-1 rounded-full border border-green-200">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block"></span>
                Live Data
              </span>
              {lastUpdated && (
                <span className="text-[10px] sm:text-xs text-slate-400">
                  Updated {Math.floor((Date.now() - lastUpdated.getTime()) / 1000)}s ago · auto-refreshes
                </span>
              )}
            </div>
          </motion.div>
        </div>
      </section>


      {/* Common Urban Challenges */}
      <section className="bg-slate-50 py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">Common Urban Challenges We Tackle</h2>
            <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto px-4">Our smart city platform helps municipalities efficiently manage and resolve critical infrastructure issues affecting daily life.</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {challenges.map((challenge, idx) => (
              <motion.div 
                key={idx}
                whileHover={{ y: -5 }}
                className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-100 text-center hover:shadow-lg transition-all duration-300"
              >
                <div className="text-4xl sm:text-5xl mb-6">{challenge.icon}</div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-2 sm:mb-3">{challenge.title}</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{challenge.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-brand-dark text-slate-400 py-12 sm:py-16 text-sm mt-auto border-t border-slate-800 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10 sm:gap-12">
          {/* Column 1: Brand */}
          <div className="flex flex-col items-center sm:items-start space-y-4 text-center sm:text-left">
            <div className="flex items-center space-x-2 text-white">
               <div className="flex items-end space-x-[3px] h-5 text-brand-light">
                 <div className="w-[4px] h-2 bg-brand-light/70 rounded-sm"></div>
                 <div className="w-[4px] h-3.5 bg-brand-light/90 rounded-sm"></div>
                 <div className="w-[4px] h-5 bg-brand-light rounded-sm"></div>
               </div>
               <span className="text-lg font-bold tracking-tight">UrbanPulse</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-xs mt-2">
              Empowering citizens and municipal authorities to collaborate seamlessly, building smarter, safer, and cleaner urban environments together.
            </p>
          </div>

          {/* Column 2: Quick Links */}
          <div className="flex flex-col items-center sm:items-start space-y-2 sm:space-y-3 text-center sm:text-left">
            <h4 className="text-slate-200 font-bold uppercase tracking-wider text-xs mb-2 sm:mb-3">Quick Links</h4>
            <Link to="/report" className="hover:text-brand-light transition-colors text-xs sm:text-sm">Report an Issue</Link>
            <Link to="/map" className="hover:text-brand-light transition-colors text-xs sm:text-sm">City Risk Map</Link>
            <Link to="/login" className="hover:text-brand-light transition-colors text-xs sm:text-sm">Sign In</Link>
          </div>

          {/* Column 3: Legal & Support */}
          <div className="flex flex-col items-center sm:items-start space-y-2 sm:space-y-3 text-center sm:text-left">
            <h4 className="text-slate-200 font-bold uppercase tracking-wider text-xs mb-2 sm:mb-3">Support &amp; Legal</h4>
            <a href="#" className="hover:text-brand-light transition-colors text-xs sm:text-sm">Privacy Policy</a>
            <a href="#" className="hover:text-brand-light transition-colors text-xs sm:text-sm">Terms of Service</a>
            <a href="#" className="hover:text-brand-light transition-colors text-xs sm:text-sm">Contact Support</a>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto mt-12 sm:mt-16 pt-8 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between text-center sm:text-left gap-4">
          <p className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-widest font-bold">
            © 2026 UrbanPulse · Designed for Indian Cities
          </p>
        </div>
      </footer>

    </div>
  );
}
