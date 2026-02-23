import React, { useState, useEffect } from 'react';

const Scrapes = () => {
    const [scrapes, setScrapes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedData, setSelectedData] = useState(null);

    useEffect(() => {
        const fetchScrapes = async () => {
            try {
                const response = await fetch('http://localhost:8000/api/v1/scrapes/');
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
        <div className="p-6">
            <h1 className="text-3xl font-extrabold text-gray-900 mb-8 tracking-tight">Verified Sources & Scrapes</h1>
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Topic ID</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Source URL</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Type</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Status</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-widest">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {scrapes.map((scrape) => (
                            <tr key={scrape.id} className="hover:bg-gray-50 transition-colors duration-150">
                                <td className="px-6 py-5 whitespace-nowrap">
                                    <a
                                        href={`/topics?id=${scrape.trending_id}`}
                                        className="inline-flex items-center px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-black hover:bg-indigo-100 transition-colors"
                                    >
                                        ID #{scrape.trending_id}
                                    </a>
                                </td>
                                <td className="px-6 py-5 whitespace-nowrap">
                                    <a
                                        href={scrape.url && scrape.url[0]}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm font-semibold text-indigo-600 truncate max-w-xs block hover:underline"
                                    >
                                        {scrape.url && scrape.url[0]}
                                    </a>
                                    <div className="text-xs text-gray-400 mt-1">{new Date(scrape.created_at || Date.now()).toLocaleString()}</div>
                                </td>
                                <td className="px-6 py-5 whitespace-nowrap">
                                    <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider">
                                        Web
                                    </span>
                                </td>
                                <td className="px-6 py-5 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="h-2.5 w-2.5 rounded-full bg-green-500 mr-2 shadow-sm"></div>
                                        <span className="text-sm font-medium text-gray-700">Verified</span>
                                    </div>
                                </td>
                                <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-bold uppercase tracking-wide">
                                    <button
                                        onClick={() => setSelectedData(scrape)}
                                        className="text-indigo-600 hover:text-indigo-900 mr-6"
                                    >
                                        View Data
                                    </button>
                                    <button className="text-red-500 hover:text-red-700">Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {scrapes.length === 0 && (
                    <div className="text-center py-20">
                        <p className="text-gray-400 font-medium">No scraped data available yet.</p>
                    </div>
                )}
            </div>

            {/* View Data Modal */}
            {selectedData && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl max-w-4xl w-full p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
                        <h2 className="text-2xl font-black text-gray-900 mb-6">Scraped Data: {selectedData.title && selectedData.title[0]}</h2>
                        <div className="prose prose-indigo max-w-none text-gray-700 font-medium bg-gray-50 p-6 rounded-2xl border border-gray-100">
                            {selectedData.content && selectedData.content[0]}
                        </div>
                        <button
                            onClick={() => setSelectedData(null)}
                            className="mt-10 w-full bg-indigo-600 text-white font-black py-4 rounded-2xl hover:bg-indigo-700 transition-all text-sm uppercase tracking-widest"
                        >
                            Close Data View
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Scrapes;
