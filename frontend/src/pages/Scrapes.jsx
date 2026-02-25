import React, { useState, useEffect } from 'react';

const Scrapes = () => {
    const [scrapes, setScrapes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedData, setSelectedData] = useState(null);

    useEffect(() => {
        const fetchScrapes = async () => {
            try {
                const response = await fetch('http://localhost:8080/api/v1/scrapes/');
                if (!response.ok) {
                    throw new Error('Failed to fetch scrapes');
                }
                const data = await response.json();
                setScrapes(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchScrapes();
    }, []);

    if (loading) return <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;
    if (error) return <div className="p-8 text-red-600 bg-red-50 rounded-lg m-4">Error: {error}</div>;

    return (
        <div className="p-8 max-w-[1400px] mx-auto">
            <div className="mb-12">
                <h1 className="text-4xl font-black text-gray-900 mb-2 tracking-tight">Intelligence Repository</h1>
                <p className="text-gray-400 font-bold uppercase tracking-[0.2em] text-[10px]">Library of Verified Research Nodes</p>
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-50">
                    <thead className="bg-gray-50/50">
                        <tr>
                            <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Origin</th>
                            <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Research Node</th>
                            <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Verification</th>
                            <th className="px-8 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-50">
                        {scrapes.map((scrape) => (
                            <tr key={scrape.id} className="hover:bg-indigo-50/30 transition-all duration-300 group">
                                <td className="px-8 py-6 whitespace-nowrap">
                                    <a
                                        href={`/topics?id=${scrape.trending_id}`}
                                        className="inline-flex items-center px-4 py-2 bg-white border border-gray-100 text-indigo-600 rounded-xl text-[10px] font-black shadow-sm group-hover:border-indigo-200 transition-all"
                                    >
                                        <i className="material-icons text-xs mr-2">tag</i> ID #{scrape.trending_id}
                                    </a>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="max-w-md">
                                        <a
                                            href={scrape.url && scrape.url[0]}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm font-bold text-gray-900 truncate block hover:text-indigo-600 transition-colors"
                                        >
                                            {scrape.url && scrape.url[0]}
                                        </a>
                                        <div className="flex items-center gap-3 mt-1.5">
                                            <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">{new Date(scrape.created_at || Date.now()).toLocaleDateString()}</span>
                                            <span className="w-1 h-1 bg-gray-200 rounded-full"></span>
                                            <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Web Discovery</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-6 whitespace-nowrap">
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600">
                                            <i className="material-icons text-sm">verified</i>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-gray-900 uppercase tracking-tight">Truth Verified</p>
                                            <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Integrity Pass</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-6 whitespace-nowrap text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => setSelectedData(scrape)}
                                            className="px-5 py-2.5 bg-gray-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-gray-200"
                                        >
                                            Inspect Node
                                        </button>
                                        <button className="p-2.5 text-gray-300 hover:text-red-500 transition-colors">
                                            <i className="material-icons text-lg">delete_outline</i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {scrapes.length === 0 && (
                    <div className="text-center py-32 bg-gray-50/50">
                        <i className="material-icons text-gray-200 text-6xl mb-6">dynamic_feed</i>
                        <p className="text-gray-300 font-black uppercase tracking-[0.2em] italic">Awaiting Research Ingestion</p>
                    </div>
                )}
            </div>

            {/* View Data Modal */}
            {selectedData && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-end z-[100]">
                    <div className="bg-white h-full w-full max-w-2xl shadow-2xl flex flex-col animate-slide-in-right">
                        <div className="p-8 border-b border-gray-100 flex justify-between items-center">
                            <div>
                                <h1 className="text-2xl font-black text-gray-900 tracking-tight">Node Insight</h1>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Source: {selectedData.url && selectedData.url[0]}</p>
                            </div>
                            <button
                                onClick={() => setSelectedData(null)}
                                className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all"
                            >
                                <i className="material-icons">close</i>
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-12 bg-[#FCFDFF]">
                            <div className="max-w-prose mx-auto">
                                <div className="mb-10 p-6 bg-white border border-gray-100 rounded-3xl shadow-sm">
                                    <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-4">Discovery Context</h4>
                                    <p className="text-sm text-gray-600 font-medium leading-relaxed">
                                        {selectedData.title && selectedData.title[0]}
                                    </p>
                                </div>
                                <div className="space-y-6">
                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Extracted Intelligence</h4>
                                    <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm">
                                        <p className="text-gray-700 leading-relaxed font-medium whitespace-pre-wrap">
                                            {selectedData.content && selectedData.content[0]}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="p-8 border-t border-gray-100 bg-white">
                            <button
                                onClick={() => setSelectedData(null)}
                                className="w-full bg-gray-900 text-white font-black py-5 rounded-2xl hover:bg-black transition-all text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-gray-200"
                            >
                                Finish Inspection
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Scrapes;
