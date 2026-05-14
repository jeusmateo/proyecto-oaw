import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { Search, Calendar, ArrowUpDown, Clock, Tag, ExternalLink } from 'lucide-react';


function useDebounce<T>(value: T, delayMs: number): T {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), delayMs);
        return () => clearTimeout(timer);
    }, [value, delayMs]);
    return debounced;
}


const dateFormatter = new Intl.DateTimeFormat('es-ES', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
});

function formatDate(dateStr: string): string {
    try {
        return dateFormatter.format(new Date(dateStr));
    } catch {
        return '';
    }
}


interface ArticleCardProps {
    article: any;
    isFeatured: boolean;
    isLong: boolean;
}

const ArticleCard = memo(function ArticleCard({ article, isFeatured, isLong }: ArticleCardProps) {
    const formattedDate = useMemo(() => formatDate(article.pubDate), [article.pubDate]);

    return (
        <a
            key={article._id}
            href={article.link}
            target="_blank"
            rel="noopener noreferrer"
            className={`group block break-inside-avoid relative bg-black/40 backdrop-blur-xl overflow-hidden rounded-3xl border border-white/5 hover:border-cyan-500/50 hover:bg-black/60 transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_15px_40px_-10px_rgba(34,211,238,0.3)]`}
        >
            {/* Ambient inner glow */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

            {/* Background decorative blob */}
            {isFeatured && (
                <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-600/10 rounded-full blur-[80px] -z-0 pointer-events-none group-hover:bg-fuchsia-600/20 group-hover:blur-[100px] transition-all duration-1000"></div>
            )}
            {!isFeatured && (
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-600/10 rounded-full blur-[50px] -z-0 pointer-events-none group-hover:bg-cyan-600/15 transition-all duration-1000"></div>
            )}

            <div className="p-7 relative z-10 flex flex-col h-full">
                <div className="flex items-center gap-3 mb-5">
                    <span className="px-3 py-1 text-[10px] font-black bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 rounded-lg uppercase tracking-widest backdrop-blur-md shadow-[0_0_10px_rgba(34,211,238,0.2)] group-hover:bg-cyan-500/20 group-hover:text-cyan-200 transition-all">
                        {article.feedId?.title || 'Fuente Desconocida'}
                    </span>
                    <span className="flex items-center text-[11px] text-slate-400 font-medium ml-auto tracking-wide group-hover:text-slate-300 transition-colors">
                        <Clock size={12} className="mr-1.5 opacity-70" />
                        {formattedDate}
                    </span>
                </div>

                <h3 className={`font-black text-slate-100 mb-4 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-cyan-300 group-hover:to-fuchsia-300 transition-all duration-300 leading-tight tracking-tight ${isFeatured ? 'text-2xl lg:text-3xl' : 'text-lg lg:text-xl'}`}>
                    {article.title}
                </h3>

                <div
                    className={`text-sm text-slate-400/90 leading-relaxed font-light mb-8 flex-1 group-hover:text-slate-300 transition-colors ${isFeatured ? 'line-clamp-6' : (isLong ? 'line-clamp-4' : 'line-clamp-3')}`}
                    dangerouslySetInnerHTML={{ __html: article.description || '' }}
                ></div>

                <ArticleFooter categories={article.categories} />
            </div>

            {/* Top scanning line effect on hover */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-0 group-hover:opacity-100 group-hover:animate-[scan_2s_ease-in-out_infinite] pointer-events-none"></div>
        </a>
    );
});


const ArticleFooter = memo(function ArticleFooter({ categories }: { categories?: string[] }) {
    return (
        <div className="flex items-end justify-between mt-auto pt-5 border-t border-white/5 group-hover:border-white/10 transition-colors">
            {categories && categories.length > 0 ? (
                <div className="flex flex-wrap gap-2 flex-1 pr-4">
                    {categories.slice(0, 2).map((cat: string, i: number) => (
                        <span key={i} className="flex items-center px-2.5 py-1 text-[10px] bg-black/60 text-slate-300 border border-white/10 rounded-md whitespace-nowrap group-hover:border-cyan-500/30 transition-colors font-medium tracking-wide">
                            <Tag size={10} className="mr-1.5 opacity-50 text-cyan-400 group-hover:text-fuchsia-400 transition-colors" />
                            {cat}
                        </span>
                    ))}
                    {categories.length > 2 && (
                        <span className="px-2 py-1 text-[10px] text-slate-500 font-bold bg-black/40 rounded-md">+{categories.length - 2}</span>
                    )}
                </div>
            ) : <div></div>}

            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:bg-gradient-to-br group-hover:from-cyan-500 group-hover:to-blue-600 text-white transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 shrink-0 shadow-[0_0_15px_rgba(34,211,238,0.5)]">
                <ExternalLink size={16} strokeWidth={2.5} />
            </div>
        </div>
    );
});


export default function ArticleList() {
    const [articles, setArticles] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('pubDate');
    const [sortOrder, setSortOrder] = useState('desc');
    const [loading, setLoading] = useState(true);

    const debouncedSearch = useDebounce(search, 350);

    const fetchArticles = useCallback(async () => {
        setLoading(true);
        try {
            const query = new URLSearchParams({
                q: debouncedSearch,
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
    }, [debouncedSearch, sortBy, sortOrder]);

    useEffect(() => {
        fetchArticles();
    }, [fetchArticles]);

    useEffect(() => {
        const handleUpdate = () => fetchArticles();
        window.addEventListener('feedsUpdated', handleUpdate);
        return () => window.removeEventListener('feedsUpdated', handleUpdate);
    }, [fetchArticles]);

    const articleCards = useMemo(() =>
        articles.map((article, index) => ({
            article,
            isFeatured: index % 7 === 0,
            isLong: article.description?.length > 200,
        })),
        [articles]
    );

    return (
        <div className="flex flex-col h-full space-y-8 animate-in fade-in duration-1000 fill-mode-both relative z-10">
            {/* Top Control Panel */}
            <div className="bg-black/30 backdrop-blur-2xl border border-white/10 rounded-3xl p-5 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] flex flex-col md:flex-row gap-5 items-center justify-between relative overflow-hidden">
                {/* Subtle highlight */}
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent"></div>

                <div className="relative w-full md:max-w-xl group">
                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none transition-transform group-focus-within:scale-110">
                        <Search size={20} className="text-cyan-500/60 group-focus-within:text-cyan-400 transition-colors" />
                    </div>
                    <input
                        type="text"
                        placeholder="Buscar en el flujo de datos..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full bg-black/50 border border-white/5 rounded-2xl pl-14 pr-5 py-4 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 focus:shadow-[0_0_20px_rgba(34,211,238,0.15)] transition-all font-medium tracking-wide"
                    />
                </div>

                <div className="flex gap-4 w-full md:w-auto">
                    <div className="relative flex-1 md:w-56 group">
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="w-full bg-black/50 border border-white/5 rounded-2xl px-5 py-4 text-sm text-slate-300 focus:outline-none focus:border-fuchsia-500/50 focus:ring-1 focus:ring-fuchsia-500/50 focus:shadow-[0_0_20px_rgba(217,70,239,0.15)] appearance-none cursor-pointer transition-all font-medium"
                        >
                            <option value="pubDate">Fecha Cronológica</option>
                            <option value="title">Alfabético</option>
                            <option value="feedId">Fuente de Origen</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 pr-5 flex items-center pointer-events-none">
                            <Calendar size={18} className="text-fuchsia-500/60 group-focus-within:text-fuchsia-400 transition-colors" />
                        </div>
                    </div>

                    <button
                        onClick={() => setSortOrder(order => order === 'desc' ? 'asc' : 'desc')}
                        className="flex items-center justify-center bg-black/50 hover:bg-cyan-900/30 border border-white/5 hover:border-cyan-500/30 text-cyan-400 px-5 py-4 rounded-2xl transition-all w-14 shrink-0 group hover:shadow-[0_0_15px_rgba(34,211,238,0.2)]"
                        title={sortOrder === 'desc' ? 'Descendente' : 'Ascendente'}
                    >
                        <ArrowUpDown size={20} className={`transform transition-transform duration-500 ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
                    </button>
                </div>
            </div>

            {loading && (
                <div className="flex-1 flex items-center justify-center min-h-[500px]">
                    <div className="flex flex-col items-center gap-6">
                        <div className="relative w-20 h-20">
                            <div className="absolute inset-0 border-4 border-t-cyan-400 border-r-fuchsia-400 border-b-transparent border-l-transparent rounded-full animate-[spin_1.5s_linear_infinite]"></div>
                            <div className="absolute inset-2 border-4 border-t-transparent border-r-transparent border-b-cyan-500 border-l-fuchsia-500 rounded-full animate-[spin_2s_linear_infinite_reverse]"></div>
                        </div>
                        <p className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-400 animate-pulse text-sm font-bold tracking-widest uppercase">Decodificando flujos...</p>
                    </div>
                </div>
            )}

            {!loading && articles.length === 0 && (
                <div className="flex-1 flex items-center justify-center min-h-[500px]">
                    <div className="flex flex-col items-center max-w-md text-center p-10 bg-black/30 backdrop-blur-xl border border-white/5 rounded-3xl">
                        <div className="w-24 h-24 bg-red-500/10 rounded-2xl flex items-center justify-center mb-8 border border-red-500/20 shadow-[0_0_30px_rgba(239,68,68,0.15)] relative overflow-hidden">
                            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjMDAwIiBmaWxsLW9wYWNpdHk9IjAuMSIvPgo8cGF0aCBkPSJNMCAwbDRsNCIgc3Ryb2tlPSIjZmZmIiBzdHJva2Utb3BhY2l0eT0iMC4wNSIvPgo8L3N2Zz4=')] opacity-50"></div>
                            <Search size={40} className="text-red-400 relative z-10" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-100 mb-3 tracking-tight">Cero Coincidencias</h3>
                        <p className="text-slate-400 text-sm leading-relaxed font-medium">
                            No se detectaron señales en el espectro. Ajusta los parámetros de búsqueda o integra nuevos nodos en el panel lateral.
                        </p>
                    </div>
                </div>
            )}

            {/* Masonry Grid layout using Columns */}
            {!loading && articles.length > 0 && (
                <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-8 space-y-8 pb-16">
                    {articleCards.map(({ article, isFeatured, isLong }) => (
                        <ArticleCard
                            key={article._id}
                            article={article}
                            isFeatured={isFeatured}
                            isLong={isLong}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
