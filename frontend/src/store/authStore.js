import { create } from 'zustand';

const API_BASE = 'http://localhost:8080/api/v1';

export const useAuthStore = create((set, get) => ({
    token: localStorage.getItem('access_token') || null,
    user: null,
    orgId: null,
    organizations: [],
    isLoadingUser: false,

    setToken: (token) => {
        if (token) {
            localStorage.setItem('access_token', token);
        } else {
            localStorage.removeItem('access_token');
        }
        set({ token });
        if (token) get().fetchMe();
    },

    setUser: (user) => set({ user }),
    setOrganizations: (organizations) => set({ organizations }),
    
    setOrgId: (orgId) => {
        localStorage.setItem('active_org_id', orgId);
        set({ orgId });
    },

    fetchMe: async () => {
        const token = get().token;
        if (!token) return;

        set({ isLoadingUser: true });
        try {
            const res = await fetch(`${API_BASE}/auth/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (res.ok) {
                const userData = await res.json();
                const organizations = userData.organizations || [];
                
                // Verify cached orgId exists in current user orgs
                const cachedOrgId = localStorage.getItem('active_org_id');
                const isValidOrg = organizations.some(o => o.id.toString() === cachedOrgId?.toString());
                
                const activeOrgId = isValidOrg 
                    ? cachedOrgId 
                    : (organizations.length > 0 ? organizations[0].id : null);
                
                if (activeOrgId) {
                    localStorage.setItem('active_org_id', activeOrgId);
                }

                set({ 
                    user: userData, 
                    organizations: organizations,
                    orgId: activeOrgId,
                    isLoadingUser: false
                });
            } else {
                if (res.status === 401 || res.status === 403) {
                    get().logout();
                }
                set({ isLoadingUser: false });
            }
        } catch (err) {
            console.error("❌ Network error fetching user profile", err);
            set({ isLoadingUser: false });
        }
    },

    logout: () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('active_org_id');
        set({ token: null, user: null, orgId: null, organizations: [], isLoadingUser: false });
    }
}));
