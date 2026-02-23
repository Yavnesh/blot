
import React, { useState, useEffect } from 'react';

const FineTuneData = () => {
    const [samples, setSamples] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchSamples = async () => {
            try {
                // Assuming backend is on the same host but port 8000
                const response = await fetch('http://localhost:8000/api/v1/finetune/samples');
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
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Fine-Tuning Data Collection</h2>
                <div className="bg-pink-100 text-pink-700 px-3 py-1 rounded-full text-sm font-medium">
                    {samples.length} Samples Collected
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
