import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import api from '../services/api';

const ReviewStatsContext = createContext({});

export function ReviewStatsProvider({ children }) {
  const [stats, setStats] = useState({});

  const loadStats = useCallback(async () => {
    const { data } = await api.get('/reviews');
    const nextStats = {};
    (Array.isArray(data?.data) ? data.data : []).forEach((review) => {
      const handle = String(review.productHandle || '').trim().toLowerCase();
      if (!handle) return;
      const current = nextStats[handle] || { count: 0, total: 0 };
      current.count += 1;
      current.total += Number(review.rating) || 0;
      nextStats[handle] = current;
    });
    setStats(nextStats);
    return nextStats;
  }, []);

  useEffect(() => {
    let active = true;
    loadStats()
      .catch(() => {
        if (active) setStats({});
      });

    return () => { active = false; };
  }, [loadStats]);

  const refreshStats = useCallback(() => loadStats().catch(() => stats), [loadStats, stats]);

  return <ReviewStatsContext.Provider value={{ stats, refreshStats }}>
    {children}
  </ReviewStatsContext.Provider>;
}

export function useReviewStats(handle) {
  const { stats } = useContext(ReviewStatsContext);
  const stat = stats[String(handle || '').trim().toLowerCase()];
  return stat ? { count: stat.count, rating: stat.total / stat.count } : null;
}

export function useRefreshReviewStats() {
  return useContext(ReviewStatsContext).refreshStats;
}
