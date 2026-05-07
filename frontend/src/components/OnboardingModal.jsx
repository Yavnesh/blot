import React, { useState } from 'react';
import api from '../lib/axios';
import { useAuthStore } from '../store/authStore';

const OnboardingModal = ({ isOpen, onClose }) => {
  const { user, setUser } = useAuthStore();
  const [step, setStep] = useState(1); // 1: Website, 2: User, 3: Company
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [websiteUrl, setWebsiteUrl] = useState('');
  
  const [formData, setFormData] = useState({
    // User Profile
    full_name: user?.full_name || '',
    role_position: user?.role_position || '',
    writing_preference: user?.writing_preference || 'Professional',
    audience_familiarity: user?.audience_familiarity || 'Expert',
    
    // Company Profile
    company_name: user?.organizations?.[0]?.name || '',
    industry: user?.organizations?.[0]?.industry || '',
    description: user?.organizations?.[0]?.description || '',
    brand_voice: user?.organizations?.[0]?.brand_voice || 'Authoritative',
    brand_tone: user?.organizations?.[0]?.brand_tone || 'Serious',
    target_audience: user?.organizations?.[0]?.target_audience || '',
    products_services: user?.organizations?.[0]?.products_services || '',
    usp: user?.organizations?.[0]?.usp || '',
    content_goals: user?.organizations?.[0]?.content_goals || 'SEO & Authority',
    preferred_keywords: user?.organizations?.[0]?.preferred_keywords || '',
    competitors: user?.organizations?.[0]?.competitors || '',
    geography: user?.organizations?.[0]?.geography || '',
    key_messages: user?.organizations?.[0]?.key_messages || '',
  });

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Save User Data
      await api.put('/users/me', {
        full_name: formData.full_name,
        role_position: formData.role_position,
        writing_preference: formData.writing_preference,
        audience_familiarity: formData.audience_familiarity,
        onboarding_completed: true
      });

      // Save Organization Data
      if (user?.organizations?.[0]?.id) {
        await api.put(`/organizations/${user.organizations[0].id}`, {
          name: formData.company_name,
          industry: formData.industry,
          description: formData.description,
          brand_voice: formData.brand_voice,
          brand_tone: formData.brand_tone,
          target_audience: formData.target_audience,
          products_services: formData.products_services,
          usp: formData.usp,
          content_goals: formData.content_goals,
          preferred_keywords: formData.preferred_keywords,
          competitors: formData.competitors,
        });
      }

      // Update local state
      setUser({ ...user, onboarding_completed: true });
      onClose();
    } catch (error) {
      console.error("Failed to save profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExtract = async () => {
    if (!websiteUrl) return;
    setExtracting(true);
    try {
      const res = await api.post(`/context/extract-website?website_url=${encodeURIComponent(websiteUrl)}`);
      const profile = res.data.profile;
      setFormData({
        ...formData,
        company_name: profile.company_name || formData.company_name,
        industry: profile.industry || formData.industry,
        description: profile.description || formData.description,
        brand_voice: profile.brand_voice || formData.brand_voice,
        brand_tone: profile.brand_tone || formData.brand_tone,
        target_audience: profile.target_audience || formData.target_audience,
        usp: profile.usp || formData.usp,
        products_services: profile.products_services || formData.products_services,
        preferred_keywords: profile.keywords || formData.preferred_keywords,
        geography: profile.geography || formData.geography,
        key_messages: profile.key_messages || formData.key_messages,
      });
      setStep(2); // Move to manual confirmation
    } catch (err) {
      console.error("Extraction error:", err);
      alert("Failed to analyze website. Please try manual entry.");
      setStep(2);
    } finally {
      setExtracting(false);
    }
  };

  const handleDontShowAgain = async () => {
    try {
      await api.put('/users/me', { onboarding_completed: true });
      setUser({ ...user, onboarding_completed: true });
      onClose();
    } catch (error) {
      console.error("Error updating preference:", error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#1e293b] border border-[#334155] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="p-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Personalize Your AI Blog Experience</h2>
              <p className="text-slate-400 text-sm">
                Help the AI capture your brand's unique voice and expertise for more authentic content.
              </p>
            </div>
            <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-6 max-h-[65vh] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-slate-700">
            {step === 1 ? (
              <div className="space-y-8 py-4">
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-sky-500/10 rounded-full flex items-center justify-center text-sky-400 mx-auto border border-sky-500/20">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-black text-white uppercase tracking-widest">Magic Setup</h3>
                    <p className="text-slate-400 text-sm max-w-sm mx-auto">
                        Provide your company website and we'll automatically extract your brand voice, industry, and USP.
                    </p>
                </div>

                <div className="space-y-4">
                    <div className="relative">
                        <input 
                            value={websiteUrl}
                            onChange={(e) => setWebsiteUrl(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleExtract()}
                            className="w-full bg-[#0f172a] border border-[#334155] rounded-xl h-14 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium" 
                            placeholder="https://www.settlemate.au" 
                        />
                        <svg className="w-6 h-6 absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 21h7a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v11m0 5l4.879-4.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242z" />
                        </svg>
                    </div>
                    <button 
                        onClick={handleExtract}
                        disabled={!websiteUrl || extracting}
                        className="w-full bg-sky-600 hover:bg-sky-500 disabled:bg-slate-700 text-white font-black uppercase tracking-widest h-14 rounded-xl transition-all shadow-xl shadow-sky-500/10 flex items-center justify-center gap-3"
                    >
                        {extracting ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                Analyzing Intelligence Nodes...
                            </>
                        ) : (
                            <>Analyze Website & Auto-Fill</>
                        )}
                    </button>
                    <button onClick={() => setStep(2)} className="w-full text-slate-500 hover:text-slate-300 text-xs font-bold uppercase tracking-widest py-2">
                        Skip & Manual Entry
                    </button>
                </div>
              </div>
            ) : step === 2 ? (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-sky-400 border-b border-sky-400/20 pb-2">User Profile</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-300">Full Name</label>
                    <input name="full_name" value={formData.full_name} onChange={handleChange} className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-sky-500" placeholder="John Doe" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-300">Role/Position</label>
                    <input name="role_position" value={formData.role_position} onChange={handleChange} className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-sky-500" placeholder="CEO, Marketing Mgr..." />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-300">Writing Preference</label>
                    <select name="writing_preference" value={formData.writing_preference} onChange={handleChange} className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-sky-500">
                      <option>Formal</option>
                      <option>Casual</option>
                      <option>Technical</option>
                      <option>Storytelling</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-300">Target Audience Familiarity</label>
                    <select name="audience_familiarity" value={formData.audience_familiarity} onChange={handleChange} className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-sky-500">
                      <option>Beginner</option>
                      <option>Intermediate</option>
                      <option>Expert</option>
                    </select>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4 pb-10">
                <h3 className="text-lg font-semibold text-sky-400 border-b border-sky-400/20 pb-2">Company Profile</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-300">Company Name</label>
                    <input name="company_name" value={formData.company_name} onChange={handleChange} className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-sky-500" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-300">Industry/Niche</label>
                    <input name="industry" value={formData.industry} onChange={handleChange} className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-sky-500" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">Company Description</label>
                  <textarea name="description" value={formData.description} onChange={handleChange} rows={2} className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-sky-500" placeholder="Brief overview of what you do..." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-300">Brand Voice</label>
                    <input name="brand_voice" value={formData.brand_voice} onChange={handleChange} className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-sky-500" placeholder="e.g. Friendly, Authoritative" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-300">Brand Tone</label>
                    <input name="brand_tone" value={formData.brand_tone} onChange={handleChange} className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-sky-500" placeholder="e.g. Serious, Conversational" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-300">Target Audience</label>
                    <input name="target_audience" value={formData.target_audience} onChange={handleChange} className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-sky-500" placeholder="Who you serve" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-300">Unique Selling Proposition (USP)</label>
                    <input name="usp" value={formData.usp} onChange={handleChange} className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-sky-500" placeholder="What makes you special" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">Key Products/Services</label>
                  <textarea name="products_services" value={formData.products_services} onChange={handleChange} rows={1} className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-sky-500" />
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              {step === 1 ? (
                null
              ) : step === 2 ? (
                <button onClick={() => setStep(3)} className="bg-sky-600 hover:bg-sky-500 text-white font-semibold py-2 px-6 rounded-lg transition-all ml-auto">
                  Next: Company Profile
                </button>
              ) : (
                <div className="flex gap-4 w-full">
                  <button onClick={() => setStep(2)} className="text-slate-400 hover:text-white font-medium">Back</button>
                  <button onClick={handleSave} disabled={loading} className="flex-1 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold py-2 px-6 rounded-lg shadow-lg shadow-sky-500/20 disabled:opacity-50 transition-all">
                    {loading ? 'Saving...' : 'Save & Continue'}
                  </button>
                </div>
              )}
            </div>
            
            <div className="flex justify-between border-t border-slate-700/50 pt-4 mt-2">
              <button onClick={onClose} className="text-slate-400 hover:text-white text-sm">Skip for Now</button>
              <button onClick={handleDontShowAgain} className="text-rose-400 hover:text-rose-300 text-sm">Don't Show Again</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingModal;
