import React, { createContext, useContext, useState, useEffect } from 'react';
import { reportService } from '../services/api';

const IssueContext = createContext();

export function useIssues() {
  return useContext(IssueContext);
}

export function IssueProvider({ children }) {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(false);

  // Initial fetch of issues on load
  useEffect(() => {
    const fetchIssues = async () => {
      setLoading(true);
      try {
        const response = await reportService.getIssues();
        setIssues(response.data);
      } catch (error) {
        console.error("Failed to fetch issues", error);
      } finally {
        setLoading(false);
      }
    };
    fetchIssues();
  }, []);

  const addIssue = (newIssue) => {
    setIssues(prev => [...prev, newIssue]);
  };

  const value = {
    issues,
    loading,
    addIssue,
  };

  return (
    <IssueContext.Provider value={value}>
      {children}
    </IssueContext.Provider>
  );
}
