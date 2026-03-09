import React, { useState, useEffect } from 'react';
import { Search, Calendar, ArrowUpDown, Clock, Tag, ExternalLink } from 'lucide-react';

export default function ArticleList() {
    const [articles, setArticles] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('pubDate');
    const [sortOrder, setSortOrder] = useState('desc');
    const [loading, setLoading] = useState(true);

    const fetchArticles = async () => {
        setLoading(true);
        try {
            const query = new URLSearchParams({
                q: search,
                sortBy,
                sortOrder,
                page: '1',
                limit: '50'
            });
            const res = await fetch(`/api/articles?${query.toString()}`);
            const data = await res.json();
            setArticles(data.articles || []);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchArticles();
    }, [search, sortBy, sortOrder]);

    useEffect(() => {
        const handleUpdate = () => fetchArticles();
        window.addEventListener('feedsUpdated', handleUpdate);
        return () => window.removeEventListener('feedsUpdated', handleUpdate);
    }, [search, sortBy, sortOrder]);

    return (
        <div className="flex flex-col h-full space-y-8 animate-in fade-in duration-700">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-6 shadow-xl flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:max-w-md">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <Search size={18} className="text-gray-500" />
                    </div>
                    <input
                        type="text"
                        placeholder="Buscar noticias..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all"
                    />
                </div>

                <div className="flex gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-48">
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-teal-500/50 appearance-none cursor-pointer transition-all"
                        >
                            <option value="pubDate">Fecha de publicación</option>
                            <option value="title">Título</option>
                            <option value="feedId">Fuente</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                            <Calendar size={16} className="text-gray-500" />
                        </div>
                    </div>

                    <button
                        onClick={() => setSortOrder(order => order === 'desc' ? 'asc' : 'desc')}
                        className="flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 text-white px-4 py-3 rounded-xl transition-all w-12 shrink-0 group"
                        title={sortOrder === 'desc' ? 'Descendente' : 'Ascendente'}
                    >
                        <ArrowUpDown size={18} className={`transform transition-transform duration-300 ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
                    </button>
                </div>
            </div>

            {loading && (
                <div className="flex-1 flex items-center justify-center min-h-[400px]">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-teal-500/20 border-t-teal-500 rounded-full animate-spin"></div>
                        <p className="text-teal-400/80 animate-pulse text-sm font-medium">Buscando noticias...</p>
                    </div>
                </div>
            )}

            {!loading && articles.length === 0 && (
                <div className="flex-1 flex items-center justify-center min-h-[400px]">
                    <div className="flex flex-col items-center max-w-sm text-center">
                        <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                            <Search size={32} className="text-gray-500" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">No se encontraron noticias</h3>
                        <p className="text-gray-400 text-sm">
                            Intenta cambiar los términos de búsqueda o añade nuevas fuentes en el panel lateral.
                        </p>
                    </div>
                </div>
            )}

            {/* Irregular Masonry Grid layout using Columns */}
            {!loading && articles.length > 0 && (
                <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6 pb-12">
                    {articles.map((article, index) => {
                        // Determine sizes based on description length and index to create an irregular look
                        const isLong = article.description && article.description.length > 200;
                        const isFeatured = index % 7 === 0;

                        return (
                            <a
                                key={article._id}
                                href={article.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`group block break-inside-avoid relative bg-[#121212] overflow-hidden rounded-2xl border border-white/5 hover:border-teal-500/30 transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_10px_40px_-15px_rgba(20,184,166,0.2)]`}
                            >
                                {/* Background decorative blob */}
                                {isFeatured && (
                                    <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl -z-0 pointer-events-none group-hover:bg-emerald-500/10 transition-colors duration-700"></div>
                                )}

                                <div className="p-6 relative z-10 flex flex-col h-full">
                                    <div className="flex items-center gap-2 mb-4">
                                        <span className="px-2.5 py-1 text-[10px] font-bold bg-white/10 text-teal-300 rounded-md uppercase tracking-wider backdrop-blur-sm border border-white/5">
                                            {article.feedId?.title || 'Desconocido'}
                                        </span>
                                        <span className="flex items-center text-[11px] text-gray-500 font-medium ml-auto">
                                            <Clock size={12} className="mr-1" />
                                            {new Date(article.pubDate).toLocaleDateString('es-ES', { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </span>
                                    </div>

                                    <h3 className={`font-bold text-gray-100 mb-3 group-hover:text-teal-400 transition-colors leading-snug ${isFeatured ? 'text-2xl lg:text-3xl' : 'text-lg lg:text-xl'}`}>
                                        {article.title}
                                    </h3>

                                    <div
                                        className={`text-sm text-gray-400/90 leading-relaxed font-normal mb-6 flex-1 ${isFeatured ? 'line-clamp-6' : (isLong ? 'line-clamp-4' : 'line-clamp-3')}`}
                                        dangerouslySetInnerHTML={{ __html: article.description || '' }}
                                    ></div>

                                    <div className="flex items-end justify-between mt-auto pt-4 border-t border-white/5">
                                        {article.categories && article.categories.length > 0 ? (
                                            <div className="flex flex-wrap gap-1.5 flex-1 pr-4">
                                                {article.categories.slice(0, 2).map((cat: string, i: number) => (
                                                    <span key={i} className="flex items-center px-2 py-0.5 text-[10px] bg-black/40 text-gray-400 border border-white/5 rounded-full whitespace-nowrap">
                                                        <Tag size={8} className="mr-1 opacity-70" />
                                                        {cat}
                                                    </span>
                                                ))}
                                                {article.categories.length > 2 && (
                                                    <span className="px-1.5 py-0.5 text-[10px] text-gray-500">+{article.categories.length - 2}</span>
                                                )}
                                            </div>
                                        ) : <div></div>}

                                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:bg-teal-500/20 text-teal-400 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0 shrink-0">
                                            <ExternalLink size={14} />
                                        </div>
                                    </div>
                                </div>
                            </a>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
