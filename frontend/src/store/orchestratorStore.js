import { create } from 'zustand';
import api from '../lib/axios';

export const useOrchestratorStore = create((set, get) => ({
    // 1. Pipeline State
    activePipeline: {
        job_id: null,
        current_node: 'idle', // discovery, research, strategy, writing, optimization, evaluation, approval
        history: [],
        logs: [],
        status: 'idle',
        connectionStatus: 'disconnected',
        selectedNode: null
    },
    
    // 2. Content State
    contentState: {
        draft: '',
        seo_data: {
            score: 0,
            keywords: [],
            suggestions: []
        },
        agent_feedback: []
    },
    
    // 3. UI State
    uiView: 'editor', // 'editor' | 'map'
    isBrandVaultOpen: false,
    
    // 4. Vault State
    vaultAssets: [],
    selectedAssetIds: [],
    isUploading: false,

    // Actions
    setActivePipeline: (pipelineData) => set((state) => ({
        activePipeline: { ...state.activePipeline, ...pipelineData }
    })),
    
    setSelectedNode: (nodeId) => set((state) => ({
        activePipeline: { ...state.activePipeline, selectedNode: nodeId }
    })),
    
    updateContent: (content) => set((state) => ({
        contentState: { ...state.contentState, draft: content }
    })),
    
    setSeoData: (seoData) => set((state) => ({
        contentState: { ...state.contentState, seo_data: seoData }
    })),
    
    addLog: (log) => set((state) => {
        const isDuplicate = state.activePipeline.logs.some(
            l => l.step === log.step && (l.text === log.text || l.message === log.text)
        );
        if (isDuplicate) return state;
        return {
            activePipeline: {
                ...state.activePipeline,
                logs: [...state.activePipeline.logs, log]
            }
        };
    }),
    
    toggleView: () => set((state) => ({
        uiView: state.uiView === 'editor' ? 'map' : 'editor'
    })),
    
    setBrandVaultOpen: (isOpen) => {
        set({ isBrandVaultOpen: isOpen });
        if (isOpen) get().fetchVaultAssets();
    },

    triggerPipeline: async (topic, pipelineType = 'blog', options = {}) => {
        set((state) => ({
            activePipeline: {
                ...state.activePipeline,
                topic,
                current_node: 'discovery',
                selectedNode: null,
                logs: [],
                status: 'running'
            }
        }));
        try {
            const { selectedAssetIds } = get();
            await api.post('/generation/trigger', { 
                user_topic: topic, 
                include_images: pipelineType !== 'instagram', 
                pipeline_type: pipelineType,
                instagram_format: options.instagram_format || 'carousel',
                tone: options.tone || 'educational',
                audience: options.audience || 'developers',
                word_count_target: options.word_count_target || 1500,
                target_audience_taxonomy: options.target_audience_taxonomy || null,
                editorial_tone_taxonomy: options.editorial_tone_taxonomy || null,
                context_document_ids: selectedAssetIds,
                research_mode: selectedAssetIds.length > 0 ? 'hybrid' : 'web'
            });
        } catch (err) {
            console.error("Trigger Error:", err);
            set((state) => ({ activePipeline: { ...state.activePipeline, status: 'error' } }));
        }
    },

    loadTask: async (task_id) => {
        try {
            const res = await api.get(`/generation/status/${task_id}`);
            const data = res.data;
            
            set({
                activePipeline: {
                    job_id: data.task_id,
                    topic: data.topic,
                    current_node: data.current_step || 'discovery',
                    status: data.status || 'running',
                    logs: data.logs || []
                },
                contentState: {
                    draft: data.preview_data?.content || '',
                    seo_data: {
                        score: data.preview_data?.seo_score || 0,
                        keywords: [],
                        suggestions: []
                    },
                    agent_feedback: []
                }
            });
            return data;
        } catch (err) {
            console.error("Load Task Error:", err);
            throw err;
        }
    },


    // 5. HITL Actions
    approveTask: async (job_id, feedback = "") => {
        try {
            await api.post(`/generation/approve/${job_id}`, { approved: true, feedback });
            set((state) => ({ activePipeline: { ...state.activePipeline, current_node: 'finalizing' } }));
        } catch (err) {
            console.error("HITL Approval Error:", err);
        }
    },

    rejectTask: async (job_id, feedback) => {
        try {
            await api.post(`/generation/approve/${job_id}`, { approved: false, feedback });
            set((state) => ({ activePipeline: { ...state.activePipeline, status: 'rejected' } }));
        } catch (err) {
            console.error("HITL Rejection Error:", err);
        }
    },

    // 6. Vault Actions
    fetchVaultAssets: async () => {
        try {
            const res = await api.get('/context/');
            set({ vaultAssets: res.data });
        } catch (err) {
            console.error("Vault Fetch Error:", err);
        }
    },

    uploadVaultAsset: async (file) => {
        set({ isUploading: true });
        const formData = new FormData();
        formData.append('file', file);
        try {
            await api.post('/context/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            get().fetchVaultAssets();
        } catch (err) {
            console.error("Vault Upload Error:", err);
        } finally {
            set({ isUploading: false });
        }
    },

    toggleAssetSelection: (assetId) => set((state) => ({
        selectedAssetIds: state.selectedAssetIds.includes(assetId)
            ? state.selectedAssetIds.filter(id => id !== assetId)
            : [...state.selectedAssetIds, assetId]
    }))
}));
