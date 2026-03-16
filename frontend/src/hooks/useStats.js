import { useState, useEffect, useRef, useCallback } from 'react';

const POLL_INTERVAL_MS = 30_000; // refresh every 30 seconds

/**
 * useStats — fetches live city-wide stats from the backend and re-fetches
 * every 30s so the numbers update in real-time without a page reload.
 *
 * Returns:
 *   totalReports    — total number of issues ever submitted
 *   resolvedIssues  — count of issues with status 'resolved' or 'closed'
 *   activeRisks     — count of issues still in 'reported' status (urgent / unactioned)
 *   inProgress      — count of issues currently being worked on
 *   resolutionRate  — percentage resolved (0-100, rounded to 1 dp)
 *   byCategory      — { pothole, waterlogging, drainage, streetlight, garbage }
 *   byWard          — { [wardName]: count }
 *   loading         — true while the first fetch is in progress
 *   lastUpdated     — Date of last successful fetch
 */
export function useStats() {
  const [stats, setStats] = useState({
    totalReports: null,
    resolvedIssues: null,
    activeRisks: null,
    inProgress: null,
    resolutionRate: null,
    byCategory: {},
    byWard: {},
    loading: true,
    lastUpdated: null,
  });

  const timerRef = useRef(null);

  const fetchStats = useCallback(async () => {
    try {
      // Original baseUrl for issues API
      const issuesApiBaseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
      // New baseUrl for AI service, if needed elsewhere (not directly used in this fetchStats for issues)
      // const aiApiBaseUrl = import.meta.env.VITE_AI_URL || 'http://localhost:8000';
      // Image base URL, if needed elsewhere (not directly used in this fetchStats for issues)
      // const imageBaseUrl = import.meta.env.VITE_IMG_BASE_URL || 'http://localhost:5000';

      const res = await fetch(`${issuesApiBaseUrl}/api/issues?public=true`);
      if (!res.ok) throw new Error('Failed to fetch issues');
      const json = await res.json();
      const issues = json.data || [];

      const total = issues.length;
      const resolved = issues.filter(i => i.status === 'resolved' || i.status === 'closed').length;
      const active = issues.filter(i => i.status === 'reported').length;
      const inProg = issues.filter(i => i.status === 'in-progress').length;
      const resRate = total > 0 ? ((resolved / total) * 100).toFixed(1) : '0.0';

      // Count by category
      const byCategory = {};
      issues.forEach(i => {
        const cat = i.category || 'other';
        byCategory[cat] = (byCategory[cat] || 0) + 1;
      });

      // Count by ward
      const byWard = {};
      issues.forEach(i => {
        const ward = i.ward || 'Unknown';
        byWard[ward] = (byWard[ward] || 0) + 1;
      });

      setStats({
        totalReports: total,
        resolvedIssues: resolved,
        activeRisks: active,
        inProgress: inProg,
        resolutionRate: resRate,
        byCategory,
        byWard,
        loading: false,
        lastUpdated: new Date(),
      });
    } catch (err) {
      console.warn('useStats: fetch failed, keeping previous values', err);
      setStats(prev => ({ ...prev, loading: false }));
    }
  }, []);

  useEffect(() => {
    fetchStats(); // immediate first fetch
    timerRef.current = setInterval(fetchStats, POLL_INTERVAL_MS);
    return () => clearInterval(timerRef.current);
  }, [fetchStats]);

  return stats;
}
