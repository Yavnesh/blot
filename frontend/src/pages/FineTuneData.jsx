
import React, { useState, useEffect } from 'react';

const FineTuneData = () => {
    const [samples, setSamples] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchSamples = async () => {
            try {
                // Assuming backend is on the same host but port 8000
                const response = await fetch('http://localhost:8080/api/v1/finetune/samples');
                if (!response.ok) {
                    throw new Error('Failed to fetch fine-tuning data');
                }
                const data = await response.json();
                setSamples(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchSamples();
    }, []);

    if (loading) return <div className="flex justify-center p-12"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div></div>;
    if (error) return <div className="p-6 text-red-500 bg-red-50 rounded-xl border border-red-200">Error: {error}</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
                <div className="max-w-2xl">
                    <h2 className="text-3xl font-black text-gray-900 mb-3 tracking-tight">Fine-Tuning Dataset Refinery</h2>
                    <p className="text-gray-500 text-sm font-medium leading-relaxed">
                        This module captures the <span className="text-indigo-600 font-bold uppercase tracking-tighter">Latent Intelligence Traces</span> from the editorial pipeline. Each entry is a high-quality "Instruction-Completion" pair used to train future iterations of the agents, ensuring the system evolves and matures with every post generated.
                    </p>
                </div>
                <div className="text-right">
                    <div className="bg-indigo-50 text-indigo-600 px-6 py-3 rounded-2xl border border-indigo-100 mb-2">
                        <span className="text-2xl font-black">{samples.length}</span>
                        <span className="text-[10px] font-black uppercase tracking-widest ml-2">Intelligence Pairs</span>
                    </div>
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest uppercase">Autonomous Collection Active</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {samples.map((sample) => (
                    <div key={sample.id} className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
                        <div className="bg-gray-50 px-6 py-3 border-b border-gray-100 flex justify-between items-center">
                            <span className="font-bold text-gray-700">{sample.agent_role}</span>
                            <span className="text-xs text-gray-400">{new Date(sample.created_at).toLocaleString()}</span>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Prompt</h4>
                                <div className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm font-mono overflow-x-auto">
                                    {sample.prompt}
                                </div>
                            </div>
                            <div>
                                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Completion</h4>
                                <div className="bg-pink-50 text-gray-800 p-4 rounded-lg text-sm border border-pink-100 whitespace-pre-wrap">
                                    {sample.completion}
                                </div>
                            </div>
                            <div className="flex items-center space-x-4">
                                <div className="flex items-center">
                                    <span className="text-xs font-semibold text-gray-400 uppercase mr-2">Score:</span>
                                    <span className={`text-sm font-bold ${sample.score >= 90 ? 'text-green-600' : 'text-orange-600'}`}>
                                        {sample.score}%
                                    </span>
                                </div>
                                <div className="flex items-center">
                                    <span className="text-xs font-semibold text-gray-400 uppercase mr-2">Format:</span>
                                    <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded uppercase font-bold tracking-tight">
                                        {sample.format}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {samples.length === 0 && (
                <div className="bg-white rounded-xl shadow-md p-12 text-center text-gray-500">
                    <i className="material-icons text-6xl mb-4 text-gray-200">history_edu</i>
                    <p>No fine-tuning data collected yet. Run the editorial pipeline to capture traces.</p>
                </div>
            )}
        </div>
    );
};

export default FineTuneData;
