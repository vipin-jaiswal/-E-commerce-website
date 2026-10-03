import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';

const ReviewStatsContext = createContext({});

export function ReviewStatsProvider({ children }) {
  const [stats, setStats] = useState({});

  useEffect(() => {
    let active = true;
    api.get('/reviews')
      .then(({ data }) => {
        if (!active) return;
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
      })
      .catch(() => {
        if (active) setStats({});
      });

    return () => { active = false; };
  }, []);

  return <ReviewStatsContext.Provider value={stats}>{children}</ReviewStatsContext.Provider>;
}

export function useReviewStats(handle) {
  const stats = useContext(ReviewStatsContext)[String(handle || '').trim().toLowerCase()];
  return stats ? { count: stats.count, rating: stats.total / stats.count } : null;
}
