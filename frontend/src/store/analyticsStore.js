import { create } from 'zustand';
import api from '../lib/axios';

export const useAnalyticsStore = create((set) => ({
    velocity: [],
    agents: [],
    seoDistribution: [],
    totals: {
        posts: 0,
        topics: 0,
        scrapes: 0,
        cost: 0,
        tokens: 0
    },
    technicalStats: {
        latency_vs_accuracy: [],
        reach_data: []
    },
    loading: false,
    error: null,

    fetchAnalytics: async () => {
        set({ loading: true, error: null });
        try {
            const res = await api.get('/analytics/summary');
            set({ 
                velocity: res.data.velocity,
                agents: res.data.agents,
                seoDistribution: res.data.seo_distribution,
                totals: res.data.totals,
                technicalStats: res.data.technical_stats,
                loading: false 
            });
        } catch (err) {
            set({ error: err.message, loading: false });
        }
    }
}));
