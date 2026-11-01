import { create } from 'zustand';

const API_BASE = 'http://localhost:8080/api/v1';

export const useProjectStore = create((set, get) => ({
    projects: [],
    activeProjectId: localStorage.getItem('active_project_id') || null,
    isLoadingProjects: false,
    error: null,

    setActiveProjectId: (projectId) => {
        if (projectId) {
            localStorage.setItem('active_project_id', projectId);
        } else {
            localStorage.removeItem('active_project_id');
        }
        set({ activeProjectId: projectId });
    },

    getActiveProject: () => {
        const { projects, activeProjectId } = get();
        return projects.find(p => p.id?.toString() === activeProjectId?.toString()) || null;
    },

    fetchProjects: async (token) => {
        if (!token) return;
        set({ isLoadingProjects: true, error: null });
        try {
            const res = await fetch(`${API_BASE}/projects/`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.ok) {
                const data = await res.json();
                set({ projects: data, isLoadingProjects: false });

                // If activeProjectId is not set or not in list, select first available project
                const currentActive = get().activeProjectId;
                const exists = data.some(p => p.id?.toString() === currentActive?.toString());
                if ((!currentActive || !exists) && data.length > 0) {
                    get().setActiveProjectId(data[0].id);
                }
            } else {
                set({ isLoadingProjects: false, error: 'Failed to fetch projects' });
            }
        } catch (err) {
            set({ isLoadingProjects: false, error: err.message });
        }
    },

    createProject: async (token, projectData) => {
        if (!token) return false;
        try {
            const res = await fetch(`${API_BASE}/projects/`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(projectData)
            });

            if (res.ok) {
                const newProject = await res.json();
                set(state => ({
                    projects: [...state.projects, newProject]
                }));
                get().setActiveProjectId(newProject.id);
                return newProject;
            }
            return false;
        } catch (err) {
            return false;
        }
    }
}));
