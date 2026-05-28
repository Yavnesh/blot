import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Sparkles, ArrowRight, Cpu, Database, CheckCircle2, 
    AlertTriangle, Terminal, BrainCircuit, Search, 
    Instagram, Sliders, Type, Users, Copy, Check, MessageSquare
} from 'lucide-react';
import OrchestratorStepper from '../components/OrchestratorStepper';
import BrandVault from '../components/BrandVault';
import { useOrchestratorStore } from '../store/orchestratorStore';
import { usePipelineSocket } from '../lib/socket';
import api from '../lib/axios';

const Input = React.forwardRef(({ className, ...props }, ref) => {
    return (
        <input
            className={`flex w-full bg-slate-950 border-2 border-white/5 rounded-xl px-4 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-teal-500/20 disabled:cursor-not-allowed disabled:opacity-50 transition-all ${className}`}
            ref={ref}
            {...props}
        />
    );
});

const InstagramWorkspace = () => {
    const {
        setBrandVaultOpen,
        activePipeline = {},
        approveTask,
        rejectTask,
        triggerPipeline,
        selectedAssetIds = [],
        contentState,
        updateContent
    } = useOrchestratorStore();

    const [topicInput, setTopicInput] = useState('');
    const [debugMode, setDebugMode] = useState(false);
    const [format, setFormat] = useState('carousel');
    
    const [copiedCaption, setCopiedCaption] = useState(false);
    const [copiedPromptId, setCopiedPromptId] = useState(null);

    // Taxonomy States
    const [taxonomyData, setTaxonomyData] = useState([]);
    const [audiencePrimary, setAudiencePrimary] = useState('');
    const [audienceSecondaries, setAudienceSecondaries] = useState([]);
    const [audienceSearch, setAudienceSearch] = useState('');

    const [tonePrimary, setTonePrimary] = useState('');
    const [toneSecondaries, setToneSecondaries] = useState([]);
    const [toneSearch, setToneSearch] = useState('');

    // Initialize the WebSocket listener for LangGraph updates
    usePipelineSocket();

    useEffect(() => {
        const fetchTaxonomy = async () => {
            try {
                const res = await api.get('/taxonomy/');
                setTaxonomyData(res.data);
                
                // Set default primaries
                const audienceCat = res.data.find(c => c.name === "Target Audience");
                if (audienceCat && audienceCat.primary_subcategories?.length > 0) {
                    setAudiencePrimary(String(audienceCat.primary_subcategories[0].id));
                }
                
                const toneCat = res.data.find(c => c.name === "Editorial Tone");
                if (toneCat && toneCat.primary_subcategories?.length > 0) {
                    setTonePrimary(String(toneCat.primary_subcategories[0].id));
                }
            } catch (e) {
                console.error("Failed to fetch taxonomy:", e);
            }
        };
        fetchTaxonomy();
    }, []);

    const targetAudienceCategory = taxonomyData.find(c => c.name === "Target Audience");
    const editorialToneCategory = taxonomyData.find(c => c.name === "Editorial Tone");

    const audiencePrimaryOptions = targetAudienceCategory?.primary_subcategories || [];
    const tonePrimaryOptions = editorialToneCategory?.primary_subcategories || [];

    const selectedAudiencePrimaryObj = audiencePrimaryOptions.find(p => String(p.id) === String(audiencePrimary));
    const selectedTonePrimaryObj = tonePrimaryOptions.find(p => String(p.id) === String(tonePrimary));

    const audienceSecondaryOptions = selectedAudiencePrimaryObj?.secondary_subcategories || [];
    const toneSecondaryOptions = selectedTonePrimaryObj?.secondary_subcategories || [];

    const filteredAudienceSecondaries = audienceSecondaryOptions.filter(s => 
        s.name.toLowerCase().includes(audienceSearch.toLowerCase())
    );
    const filteredToneSecondaries = toneSecondaryOptions.filter(s => 
        s.name.toLowerCase().includes(toneSearch.toLowerCase())
    );

    const handleAudiencePrimaryChange = (val) => {
        setAudiencePrimary(val);
        setAudienceSecondaries([]);
        setAudienceSearch('');
    };

    const handleTonePrimaryChange = (val) => {
        setTonePrimary(val);
        setToneSecondaries([]);
        setToneSearch('');
    };

    const isTaxonomyValid = 
        targetAudienceCategory && 
        editorialToneCategory && 
        audiencePrimary && 
        audienceSecondaries.length > 0 && 
        tonePrimary && 
        toneSecondaries.length > 0;

    const isAwaitingApproval = activePipeline?.status === 'awaiting_approval' || activePipeline?.current_node === 'approval';
    const isRunning = activePipeline?.status === 'running';

    const handleStartGeneration = () => {
        if (!topicInput.trim() || !isTaxonomyValid) return;
        
        triggerPipeline(topicInput.trim(), 'instagram', {
            instagram_format: format,
            tone: selectedTonePrimaryObj?.name || 'educational',
            audience: selectedAudiencePrimaryObj?.name || 'developers',
            target_audience_taxonomy: {
                category_id: targetAudienceCategory.id,
                primary_subcategory_id: Number(audiencePrimary),
                secondary_subcategory_ids: audienceSecondaries
            },
            editorial_tone_taxonomy: {
                category_id: editorialToneCategory.id,
                primary_subcategory_id: Number(tonePrimary),
                secondary_subcategory_ids: toneSecondaries
            }
        });
        setTopicInput('');
    };

    // Parse the draft if it's a JSON string
    let parsedDraft = null;
    let parseError = false;
    if (contentState.draft) {
        try {
            parsedDraft = JSON.parse(contentState.draft);
        } catch (e) {
            parseError = true;
        }
    }

    const handleUpdateSlide = (index, field, value) => {
        if (!parsedDraft) return;
        const updatedSlides = [...parsedDraft.slides];
        updatedSlides[index] = { ...updatedSlides[index], [field]: value };
        const updatedDraft = { ...parsedDraft, slides: updatedSlides };
        updateContent(JSON.stringify(updatedDraft));
    };

    const handleUpdateCaption = (value) => {
        if (!parsedDraft) return;
        const updatedDraft = { ...parsedDraft, caption: value };
        updateContent(JSON.stringify(updatedDraft));
    };

    const handleUpdateHashtags = (index, value) => {
        if (!parsedDraft) return;
        const updatedHashtags = [...parsedDraft.hashtags];
        updatedHashtags[index] = value;
        const updatedDraft = { ...parsedDraft, hashtags: updatedHashtags };
        updateContent(JSON.stringify(updatedDraft));
    };

    const copyToClipboard = (text, type = 'caption', id = null) => {
        navigator.clipboard.writeText(text);
        if (type === 'caption') {
            setCopiedCaption(true);
            setTimeout(() => setCopiedCaption(false), 2000);
        } else if (type === 'prompt') {
            setCopiedPromptId(id);
            setTimeout(() => setCopiedPromptId(null), 2000);
        }
    };

    return (
        <div className="flex flex-col gap-6 md:gap-8 lg:gap-10 pb-32 max-w-[1600px] mx-auto w-full px-4 md:px-8 lg:px-12 font-sans text-slate-100">
            {/* 1. Configuration Panel */}
            <div className="glass-panel p-5 md:p-8 lg:p-10 border border-white/5 bg-slate-900/60 relative overflow-hidden group rounded-2xl md:rounded-3xl shadow-2xl">
                <div className="absolute -top-24 -left-24 w-64 h-64 bg-teal-500/10 blur-[100px] rounded-full pointer-events-none" />
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-6">
                        <Instagram className="text-teal-400 w-5 h-5" />
                        <h2 className="text-[10px] md:text-xs font-black uppercase tracking-[0.3em] text-slate-400">Instagram Campaign Builder</h2>
                    </div>

                    <div className="flex flex-col gap-6 mb-6">
                        {/* Format */}
                        <div className="flex flex-col gap-2 max-w-md">
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                <Sliders size={12} className="text-teal-400" /> Content Format
                            </label>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setFormat('carousel')}
                                    className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-widest border transition-all ${
                                        format === 'carousel' 
                                            ? 'bg-teal-500/10 border-teal-500/30 text-teal-400' 
                                            : 'bg-slate-950 border-white/5 text-slate-500 hover:text-slate-300'
                                    }`}
                                >
                                    Carousel (Multi-slide)
                                </button>
                                <button
                                    onClick={() => setFormat('single')}
                                    className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-widest border transition-all ${
                                        format === 'single' 
                                            ? 'bg-teal-500/10 border-teal-500/30 text-teal-400' 
                                            : 'bg-slate-950 border-white/5 text-slate-500 hover:text-slate-300'
                                    }`}
                                >
                                    Single Post
                                </button>
                            </div>
                        </div>

                        {/* Hierarchical Taxonomies */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Target Audience Config */}
                            <div className="flex flex-col gap-4 bg-slate-950/40 p-5 rounded-2xl border border-white/5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-teal-400 flex items-center gap-2">
                                    <Users size={14} /> Target Audience Config
                                </label>
                                
                                <div className="flex flex-col gap-1">
                                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Primary Subcategory</span>
                                    <select
                                        value={audiencePrimary || ''}
                                        onChange={(e) => handleAudiencePrimaryChange(e.target.value)}
                                        className="w-full bg-slate-950 border-2 border-white/5 rounded-xl px-4 py-3 text-xs font-bold text-white uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                                    >
                                        <option value="" disabled>Select Primary Subcategory</option>
                                        {audiencePrimaryOptions.map(prim => (
                                            <option key={prim.id} value={prim.id}>{prim.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest flex justify-between">
                                        <span>Secondary Subcategories</span>
                                        <span className="text-teal-400 font-bold">{audienceSecondaries.length} Selected</span>
                                    </span>
                                    
                                    <input
                                        type="text"
                                        placeholder="Filter subcategories..."
                                        value={audienceSearch}
                                        onChange={(e) => setAudienceSearch(e.target.value)}
                                        className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 placeholder:text-slate-600"
                                    />

                                    <div className="flex flex-wrap gap-2 max-h-[140px] overflow-y-auto p-2 bg-slate-950/60 rounded-xl custom-scrollbar border border-white/5">
                                        {filteredAudienceSecondaries.length > 0 ? (
                                            filteredAudienceSecondaries.map(sec => {
                                                const isSelected = audienceSecondaries.includes(sec.id);
                                                return (
                                                    <button
                                                        key={sec.id}
                                                        onClick={() => {
                                                            setAudienceSecondaries(prev => 
                                                                prev.includes(sec.id) 
                                                                    ? prev.filter(id => id !== sec.id) 
                                                                    : [...prev, sec.id]
                                                            );
                                                        }}
                                                        className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest border transition-all ${
                                                            isSelected 
                                                                ? 'bg-teal-500/20 border-teal-500 text-teal-400 shadow-lg shadow-teal-500/10' 
                                                                : 'bg-slate-950 border-white/5 text-slate-500 hover:text-slate-300'
                                                        }`}
                                                    >
                                                        {sec.name}
                                                    </button>
                                                );
                                            })
                                        ) : (
                                            <span className="text-[9px] text-slate-600 uppercase tracking-widest p-2">No subcategories found</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Editorial Tone Config */}
                            <div className="flex flex-col gap-4 bg-slate-950/40 p-5 rounded-2xl border border-white/5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-teal-400 flex items-center gap-2">
                                    <Type size={14} /> Editorial Tone Config
                                </label>
                                
                                <div className="flex flex-col gap-1">
                                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Primary Subcategory</span>
                                    <select
                                        value={tonePrimary || ''}
                                        onChange={(e) => handleTonePrimaryChange(e.target.value)}
                                        className="w-full bg-slate-950 border-2 border-white/5 rounded-xl px-4 py-3 text-xs font-bold text-white uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                                    >
                                        <option value="" disabled>Select Primary Subcategory</option>
                                        {tonePrimaryOptions.map(prim => (
                                            <option key={prim.id} value={prim.id}>{prim.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest flex justify-between">
                                        <span>Secondary Subcategories</span>
                                        <span className="text-teal-400 font-bold">{toneSecondaries.length} Selected</span>
                                    </span>
                                    
                                    <input
                                        type="text"
                                        placeholder="Filter subcategories..."
                                        value={toneSearch}
                                        onChange={(e) => setToneSearch(e.target.value)}
                                        className="w-full bg-slate-950 border border-white/5 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 placeholder:text-slate-600"
                                    />

                                    <div className="flex flex-wrap gap-2 max-h-[140px] overflow-y-auto p-2 bg-slate-950/60 rounded-xl custom-scrollbar border border-white/5">
                                        {filteredToneSecondaries.length > 0 ? (
                                            filteredToneSecondaries.map(sec => {
                                                const isSelected = toneSecondaries.includes(sec.id);
                                                return (
                                                    <button
                                                        key={sec.id}
                                                        onClick={() => {
                                                            setToneSecondaries(prev => 
                                                                prev.includes(sec.id) 
                                                                    ? prev.filter(id => id !== sec.id) 
                                                                    : [...prev, sec.id]
                                                            );
                                                        }}
                                                        className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest border transition-all ${
                                                            isSelected 
                                                                ? 'bg-teal-500/20 border-teal-500 text-teal-400 shadow-lg shadow-teal-500/10' 
                                                                : 'bg-slate-950 border-white/5 text-slate-500 hover:text-slate-300'
                                                        }`}
                                                    >
                                                        {sec.name}
                                                    </button>
                                                );
                                            })
                                        ) : (
                                            <span className="text-[9px] text-slate-600 uppercase tracking-widest p-2">No subcategories found</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Topic Search Input */}
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Input
                                value={topicInput}
                                onChange={(e) => setTopicInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleStartGeneration()}
                                placeholder={
                                    isAwaitingApproval
                                        ? "Enter revision instructions (e.g., 'rewrite caption to be punchier'), then click 'Revise' below..."
                                        : isRunning
                                            ? "AI is synthesizing... Please wait."
                                            : "Enter Instagram post topic (e.g., '3 Ways to Optimize Docker Images')..."
                                }
                                className="w-full h-14 md:h-16 lg:h-20 bg-slate-950/50 border-white/10 text-white pl-12 md:pl-14 pr-6 rounded-xl md:rounded-2xl focus:ring-2 focus:ring-teal-500/20 text-sm md:text-base lg:text-lg font-bold placeholder:text-slate-600 transition-all"
                            />
                            <Search className="absolute left-4 md:left-5 top-1/2 -translate-y-1/2 text-slate-600 w-5 h-5 md:w-6 md:h-6" />
                        </div>
                        <button
                            onClick={handleStartGeneration}
                            disabled={!topicInput.trim() || isRunning || !isTaxonomyValid}
                            className="h-14 md:h-16 lg:h-20 px-6 md:px-10 bg-teal-600 hover:bg-teal-500 disabled:bg-slate-800 disabled:text-slate-600 text-white text-[10px] md:text-xs font-black uppercase tracking-[0.2em] md:tracking-[0.3em] rounded-xl md:rounded-2xl transition-all shadow-xl shadow-teal-500/10 flex items-center justify-center gap-3 active:scale-95 group shrink-0"
                        >
                            {isRunning ? (
                                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    Ignite Pipeline
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* 2. Stepper Tracker */}
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4 md:gap-5">
                        <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center shadow-lg transition-colors shrink-0 ${isRunning ? 'bg-teal-500 text-white animate-pulse' : 'bg-slate-800 text-slate-500'}`}>
                            <Cpu size={20} />
                        </div>
                        <div className="min-w-0">
                            <h3 className="text-white font-black text-base md:text-lg tracking-tight leading-none mb-2 truncate">
                                {activePipeline?.topic || "Ready for Instagram Synthesis"}
                            </h3>
                            <div className="flex flex-wrap items-center gap-2 md:gap-3">
                                <span className={`text-[8px] md:text-[9px] font-black uppercase tracking-widest px-2 py-0.5 md:px-2.5 md:py-1 rounded-md border ${isRunning ? 'bg-teal-500/10 text-teal-400 border-teal-500/20' : 'bg-slate-800 text-slate-600 border-white/5'}`}>
                                    {isRunning ? `${activePipeline?.current_node || 'discovery'} NODE ACTIVE` : 'NEURAL IDLE'}
                                </span>
                                <span className="text-[8px] md:text-[9px] font-black text-slate-600 uppercase tracking-widest leading-none whitespace-nowrap">• Carousel Generator v1.0</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <button
                            onClick={() => setBrandVaultOpen(true)}
                            className={`flex flex-1 md:flex-none items-center justify-center gap-2 h-10 md:h-12 px-4 md:px-5 rounded-lg md:rounded-xl border transition-all group ${(selectedAssetIds || []).length > 0 ? 'bg-teal-500/10 border-teal-500/20 text-white' : 'bg-slate-900 border-white/5 text-slate-400 hover:text-white'}`}
                        >
                            <Database size={14} className={`md:size-4 ${(selectedAssetIds || []).length > 0 ? 'text-teal-400' : 'group-hover:text-teal-400'} transition-colors`} />
                            <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest">
                                {(selectedAssetIds || []).length > 0 ? 'Context Loaded' : 'Vault Context'}
                            </span>
                        </button>
                    </div>
                </div>

                <div className="glass-panel p-4 md:p-6 border border-white/5 bg-slate-900/40 rounded-xl md:rounded-2xl overflow-hidden">
                    <OrchestratorStepper />
                </div>
            </div>

            {/* 3. Main Split Panel: Logs Stream and Instagram Output */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-10 items-start">
                
                {/* Left side: Logic Process Stream */}
                <div className="lg:col-span-4 space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <h4 className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Logic Process Stream</h4>
                        <button
                            onClick={() => setDebugMode(!debugMode)}
                            className={`flex items-center gap-2 px-3 py-1 rounded-full border transition-all ${debugMode ? 'bg-teal-500/10 border-teal-500/20 text-teal-400' : 'bg-slate-900 border-white/5 text-slate-600'}`}
                        >
                            <Terminal size={10} />
                            <span className="text-[7px] md:text-[8px] font-black uppercase tracking-widest">{debugMode ? 'DEBUG ON' : 'DEBUG OFF'}</span>
                        </button>
                    </div>

                    <div className="glass-panel p-4 md:p-6 border border-white/5 bg-slate-900/40 min-h-[300px] md:min-h-[400px] max-h-[500px] md:max-h-[600px] overflow-y-auto space-y-4 md:space-y-6 rounded-xl md:rounded-2xl no-scrollbar custom-scrollbar shadow-xl">
                        <AnimatePresence initial={false}>
                            {(() => {
                                const displayNode = activePipeline?.selectedNode || activePipeline?.current_node || 'discovery';
                                const allLogs = activePipeline?.logs?.filter(log => log.step === displayNode) || [];

                                const filteredLogs = debugMode ? allLogs : allLogs.filter(log => {
                                    const text = (log.text || log.message || "").toLowerCase();
                                    return !text.includes('state update') && !text.includes('raw output') && !text.includes('tokens');
                                });

                                return filteredLogs.length > 0 ? (
                                    [...filteredLogs].reverse().map((log, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="flex gap-3 md:gap-4 group"
                                        >
                                            <div className="flex flex-col items-center">
                                                <div className="w-5 h-5 rounded-md bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 group-first:bg-teal-500 group-first:text-white transition-colors">
                                                    <div className="w-1 h-1 rounded-full bg-current" />
                                                </div>
                                                {i !== filteredLogs.length - 1 && <div className="w-[1px] h-full bg-white/5 mt-2" />}
                                            </div>
                                            <div className="flex flex-col gap-1 pb-4">
                                                <span className="text-[7px] md:text-[8px] font-black text-slate-600 uppercase tracking-widest">{log.step || 'AGENT'} node</span>
                                                <p className="text-[11px] md:text-xs text-slate-300 font-medium leading-relaxed group-first:text-white transition-colors">{log.text || log.message}</p>
                                            </div>
                                        </motion.div>
                                    ))
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-center opacity-40 py-16">
                                        <BrainCircuit size={40} className="text-slate-700 mb-4 animate-pulse" />
                                        <p className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-slate-600">Awaiting Neural Ignition</p>
                                    </div>
                                );
                            })()}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Right side: Generated Content Dashboard */}
                <div className="lg:col-span-8 space-y-6">
                    {/* Caption & Carousel Preview */}
                    {contentState.draft ? (
                        <>
                            {parsedDraft ? (
                                <div className="space-y-6">
                                    {/* Carousel slides */}
                                    <div className="flex flex-col gap-4">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-400">Carousel Slide Deck</h4>
                                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{parsedDraft.slides?.length || 0} Slides Total</span>
                                        </div>

                                        <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar snap-x">
                                            {parsedDraft.slides?.map((slide, index) => {
                                                const bgUrl = slide.image_url || `https://picsum.photos/seed/${slide.headline?.replace(/[^a-zA-Z0-9]/g, '') || index}/800/800`;
                                                return (
                                                    <div 
                                                        key={index} 
                                                        className="snap-start shrink-0 w-80 border border-white/5 rounded-2xl p-5 flex flex-col justify-between h-[360px] relative overflow-hidden shadow-2xl"
                                                        style={{
                                                            backgroundImage: `linear-gradient(to bottom, rgba(15, 23, 42, 0.65), rgba(15, 23, 42, 0.95)), url(${bgUrl})`,
                                                            backgroundSize: 'cover',
                                                            backgroundPosition: 'center',
                                                            backgroundColor: '#0f172a'
                                                        }}
                                                    >
                                                        <div className="absolute top-2 right-2 text-slate-800 font-black text-8xl z-0 select-none opacity-20">
                                                            {slide.slide_number || index + 1}
                                                        </div>

                                                        <div className="relative z-10 flex flex-col gap-4">
                                                            <span className="text-[9px] font-black uppercase tracking-widest text-teal-400 bg-teal-500/10 border border-teal-500/20 px-2 py-0.5 rounded w-fit">
                                                                Slide {slide.slide_number || index + 1}
                                                            </span>
                                                            <input
                                                                type="text"
                                                                value={slide.headline || ''}
                                                                onChange={(e) => handleUpdateSlide(index, 'headline', e.target.value)}
                                                                className="bg-transparent border-b border-transparent hover:border-white/10 focus:border-teal-500 focus:outline-none text-white font-black text-lg tracking-tight leading-snug drop-shadow-[0_2px_8px_rgba(0,0,0,1)] w-full py-1"
                                                            />
                                                            <textarea
                                                                value={slide.body || ''}
                                                                onChange={(e) => handleUpdateSlide(index, 'body', e.target.value)}
                                                                rows={3}
                                                                className="bg-transparent border-b border-transparent hover:border-white/10 focus:border-teal-500 focus:outline-none text-white text-xs leading-relaxed drop-shadow-[0_2px_8px_rgba(0,0,0,1)] w-full resize-none py-1 custom-scrollbar"
                                                            />
                                                        </div>

                                                        <div className="relative z-10 pt-4 border-t border-white/5 flex flex-col gap-2">
                                                            <span className="text-[8px] font-black uppercase tracking-widest text-slate-500 flex items-center justify-between">
                                                                Visual AI Prompt
                                                                <button 
                                                                    onClick={() => copyToClipboard(slide.image_prompt, 'prompt', index)}
                                                                    className="text-teal-400 hover:text-white transition-colors"
                                                                >
                                                                    {copiedPromptId === index ? <Check size={10} /> : <Copy size={10} />}
                                                                </button>
                                                            </span>
                                                            <textarea
                                                                value={slide.image_prompt || ''}
                                                                onChange={(e) => handleUpdateSlide(index, 'image_prompt', e.target.value)}
                                                                rows={2}
                                                                className="bg-slate-950/60 border border-white/5 hover:border-white/10 focus:border-teal-500 focus:outline-none text-[9px] font-mono text-slate-405 p-1.5 rounded-lg w-full resize-none leading-relaxed custom-scrollbar"
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Caption & Hashtags */}
                                    <div className="glass-panel p-6 border border-white/5 bg-slate-900/40 rounded-2xl flex flex-col gap-4 shadow-xl">
                                        <div className="flex items-center justify-between border-b border-white/5 pb-4">
                                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-400 flex items-center gap-2">
                                                <MessageSquare size={14} /> Synthesized Caption
                                            </h4>
                                            <button
                                                onClick={() => copyToClipboard(parsedDraft.caption, 'caption')}
                                                className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest bg-teal-500/10 hover:bg-teal-500/20 text-teal-400 px-4 py-2 rounded-xl transition-all border border-teal-500/20"
                                            >
                                                {copiedCaption ? <Check size={12} /> : <Copy size={12} />}
                                                {copiedCaption ? 'Copied' : 'Copy Caption'}
                                            </button>
                                        </div>

                                        <textarea
                                            value={parsedDraft.caption || ''}
                                            onChange={(e) => handleUpdateCaption(e.target.value)}
                                            rows={8}
                                            className="bg-slate-950/60 border border-white/5 hover:border-white/10 focus:border-teal-500 focus:outline-none text-slate-300 text-xs md:text-sm font-medium p-4 rounded-2xl w-full leading-relaxed resize-y custom-scrollbar"
                                        />

                                        <div className="flex flex-wrap gap-2 pt-4 border-t border-white/5">
                                            {parsedDraft.hashtags?.map((tag, tagIndex) => (
                                                <input
                                                    key={tagIndex}
                                                    type="text"
                                                    value={tag}
                                                    onChange={(e) => handleUpdateHashtags(tagIndex, e.target.value)}
                                                    className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-950 border border-white/5 focus:border-teal-500/50 focus:outline-none px-2.5 py-1.5 rounded-lg w-28 text-center transition-all"
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="glass-panel p-6 border border-white/5 bg-slate-900/40 rounded-2xl">
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500 mb-4">Raw Draft Pipeline Output</h4>
                                    <pre className="text-xs text-slate-400 font-mono bg-slate-950 p-4 rounded-xl overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-[600px] border border-white/5">
                                        {contentState.draft}
                                    </pre>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="glass-panel p-10 border border-white/5 bg-slate-900/20 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center text-center min-h-[400px] shadow-xl">
                            <Instagram size={48} className="text-slate-700 mb-4 animate-pulse" />
                            <h4 className="text-white font-black text-lg tracking-tight uppercase mb-2">No Campaign Synthesized</h4>
                            <p className="text-slate-500 text-xs max-w-md font-medium leading-relaxed">
                                Enter your target topic, select the preferred format, tone and target demographic, then ignite the autonomous agent pipeline to generate post copies and visuals.
                            </p>
                        </div>
                    )}

                    {/* Quality Gate / HITL Intervention */}
                    <AnimatePresence>
                        {isAwaitingApproval && (
                            <motion.div
                                initial={{ opacity: 0, y: 50 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 50 }}
                                className="bg-amber-500 rounded-2xl md:rounded-[2.5rem] p-6 md:p-10 flex flex-col md:flex-row items-center justify-between shadow-2xl border border-white/20 relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 p-6 md:p-8 opacity-10 pointer-events-none">
                                    <AlertTriangle size={80} />
                                </div>
                                <div className="flex items-center gap-4 md:gap-6 relative z-10 w-full md:w-auto">
                                    <div className="w-12 h-12 md:w-16 md:h-16 bg-slate-950 rounded-xl md:rounded-2xl flex items-center justify-center text-amber-500 shadow-xl flex-shrink-0">
                                        <AlertTriangle size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-slate-950 font-black text-base md:text-2xl tracking-tighter mb-1">Quality Gate Active</h3>
                                        <p className="text-slate-950/70 text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em]">Intervention Required</p>
                                    </div>
                                </div>

                                <div className="flex gap-3 mt-6 md:mt-0 relative z-10 w-full md:w-auto">
                                    <button
                                        onClick={() => {
                                            rejectTask(activePipeline?.job_id, topicInput.trim() || "Needs revision");
                                            setTopicInput('');
                                        }}
                                        className="flex-1 md:flex-none px-5 md:px-6 py-3 md:py-4 bg-slate-950/10 border border-slate-950/20 text-slate-950 text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] rounded-lg md:rounded-xl hover:bg-slate-950/20 transition-all active:scale-95 font-bold"
                                    >
                                        Revise
                                    </button>
                                    <button
                                        onClick={() => approveTask(activePipeline?.job_id)}
                                        className="flex-1 md:flex-none px-6 md:px-8 py-3 md:py-4 bg-slate-950 text-white text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] rounded-lg md:rounded-xl hover:scale-105 transition-all flex items-center justify-center gap-2 md:gap-3 shadow-2xl active:scale-95 font-bold"
                                    >
                                        <CheckCircle2 size={14} />
                                        Approve Campaign
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <BrandVault />
        </div>
    );
};

export default InstagramWorkspace;
