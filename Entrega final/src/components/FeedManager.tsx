import React, { useState, useEffect, useCallback, memo } from 'react';
import { useStore } from '@nanostores/react';
import { isSidebarOpen } from '../store/uiStore';
import { Rss, Plus, Trash2, RefreshCw, AlertCircle, ChevronLeft } from 'lucide-react';


interface FeedItemProps {
    feed: any;
    onRemove: (id: string) => void;
}

const FeedItem = memo(function FeedItem({ feed, onRemove }: FeedItemProps) {
    return (
        <div className="group/item flex justify-between items-center p-4 rounded-xl bg-black/40 backdrop-blur-md border border-white/5 hover:bg-cyan-900/20 hover:border-cyan-500/30 hover:shadow-[0_0_20px_rgba(6,182,212,0.15)] transition-all duration-300 relative overflow-hidden">
            <div className="flex-1 min-w-0 pr-4 relative z-10">
                <h3 className="text-gray-200 font-medium truncate text-sm mb-1 group-hover/item:text-cyan-100 transition-colors">{feed.title || feed.url}</h3>
                <p className="text-xs text-cyan-400/60 truncate group-hover/item:text-cyan-300/80 transition-colors">{feed.url.replace(/^https?:\/\//, '')}</p>
            </div>
            <button
                onClick={() => onRemove(feed._id)}
                className="opacity-0 group-hover/item:opacity-100 text-fuchsia-400/70 hover:text-fuchsia-300 hover:bg-fuchsia-500/20 hover:shadow-[0_0_10px_rgba(217,70,239,0.3)] p-2 rounded-lg transition-all duration-300 z-10"
                title="Eliminar fuente"
            >
                <Trash2 size={18} />
            </button>

            {/* Card hover effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/5 to-transparent -translate-x-full group-hover/item:animate-[shimmer_1s_infinite] pointer-events-none"></div>
        </div>
    );
});

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function FeedManager() {
    const [feeds, setFeeds] = useState<any[]>([]);
    const [newUrl, setNewUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [syncing, setSyncing] = useState(false);

    // Use global store
    const isOpen = useStore(isSidebarOpen);

    const fetchFeeds = useCallback(async () => {
        try {
            const res = await fetch('/api/feeds');
            if (res.ok) {
                const data = await res.json();
                setFeeds(data);
            }
        } catch (err) {
            console.error('Error fetching feeds:', err);
        }
    }, []);

    useEffect(() => {
        fetchFeeds();
    }, [fetchFeeds]);

    const addFeed = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newUrl) return;
        setLoading(true);

        try {
            const res = await fetch('/api/feeds', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: newUrl })
            });
            if (res.ok) {
                setNewUrl('');
                fetchFeeds();
                window.dispatchEvent(new Event('feedsUpdated'));
            } else {
                const error = await res.json();
                alert('Error: ' + error.error);
            }
        } finally {
            setLoading(false);
        }
    }, [newUrl, fetchFeeds]);

    const syncFeeds = useCallback(async () => {
        setSyncing(true);
        try {
            const res = await fetch('/api/feeds/sync', { method: 'POST' });
            if (res.ok) {
                fetchFeeds();
                window.dispatchEvent(new Event('feedsUpdated'));
            }
        } finally {
            setSyncing(false);
        }
    }, [fetchFeeds]);

    const removeFeed = useCallback(async (id: string) => {
        if (!confirm('¿Estás seguro de que deseas eliminar este feed y todas sus noticias?')) return;
        await fetch(`/api/feeds/${id}`, { method: 'DELETE' });
        fetchFeeds();
        window.dispatchEvent(new Event('feedsUpdated'));
    }, [fetchFeeds]);

    return (
        <div
            className={`bg-black/30 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] flex flex-col relative group transition-all duration-500 ease-out origin-top shrink-0 ${isOpen ? 'h-full p-6 w-full opacity-100 overflow-hidden' : 'h-[88px] p-5 w-full md:w-[88px] overflow-hidden'}`}
        >
            {/* Decorative glassy gradients */}
            <div className={`absolute top-0 right-0 bg-cyan-500/20 rounded-full blur-3xl -z-10 transition-all duration-700 mix-blend-screen ${isOpen ? 'w-48 h-48 group-hover:bg-cyan-500/30' : 'w-24 h-24'}`}></div>
            <div className={`absolute bottom-0 left-0 bg-fuchsia-500/10 rounded-full blur-3xl -z-10 transition-all duration-700 mix-blend-screen ${isOpen ? 'w-40 h-40' : 'w-0 h-0'}`}></div>

            <div
                className={`flex items-center relative z-10 transition-all duration-300 ${isOpen ? 'justify-between mb-8' : 'justify-center w-full h-full cursor-pointer hover:scale-110'}`}
                onClick={() => !isOpen && isSidebarOpen.set(true)}
            >
                <div className={`flex items-center gap-4 transition-all duration-300 ${isOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-full absolute pointer-events-none'}`}>
                    <div className="p-2.5 bg-cyan-500/20 rounded-xl text-cyan-400 border border-cyan-500/30 shadow-[0_0_15px_rgba(34,211,238,0.2)]">
                        <Rss size={22} />
                    </div>
                    <h2 className="text-xl font-bold text-white tracking-tight whitespace-nowrap drop-shadow-md">Tus Fuentes</h2>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={(e) => { e.stopPropagation(); syncFeeds(); }}
                        disabled={syncing}
                        className={`text-cyan-400 hover:text-white hover:bg-cyan-500/40 p-2.5 rounded-xl transition-all duration-300 disabled:opacity-50 flex items-center justify-center hover:shadow-[0_0_10px_rgba(34,211,238,0.4)] ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-50 absolute pointer-events-none'}`}
                        title="Sincronizar fuentes"
                    >
                        <RefreshCw size={20} className={syncing ? "animate-spin text-white" : ""} />
                    </button>

                    <button
                        onClick={(e) => { e.stopPropagation(); isSidebarOpen.set(!isOpen); }}
                        className={`p-2.5 rounded-xl transition-all duration-300 flex items-center justify-center border ${isOpen ? 'text-gray-400 hover:bg-white/10 hover:text-white border-transparent' : 'text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/30 border-cyan-500/30 shadow-[0_0_15px_rgba(34,211,238,0.2)]'}`}
                        title={isOpen ? "Ocultar fuentes" : "Mostrar fuentes"}
                    >
                        {isOpen ? (
                            <ChevronLeft size={20} />
                        ) : <Rss size={24} className="animate-pulse drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]" />}
                    </button>
                </div>
            </div>

            <div className={`flex flex-col flex-1 w-full transition-all duration-500 ease-in-out ${isOpen ? 'opacity-100 translate-y-0 visible' : 'opacity-0 -translate-y-8 invisible hidden'}`}>
                <form onSubmit={addFeed} className="relative mb-8 z-10 shrink-0">
                    <div className="relative w-full group/input">
                        <input
                            type="url"
                            value={newUrl}
                            onChange={(e) => setNewUrl(e.target.value)}
                            placeholder="https://ejemplo.com/rss.xml"
                            className="w-full bg-black/50 border border-white/10 rounded-2xl pl-4 pr-12 py-3.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 focus:shadow-[0_0_20px_rgba(34,211,238,0.2)] transition-all"
                            required
                        />
                        <button
                            type="submit"
                            disabled={loading}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl transition-all disabled:opacity-50 shadow-[0_0_10px_rgba(34,211,238,0.4)] hover:shadow-[0_0_15px_rgba(34,211,238,0.6)]"
                        >
                            {loading ? <RefreshCw size={18} className="animate-spin" /> : <Plus size={18} />}
                        </button>
                    </div>
                </form>

                <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar z-10 pr-2 pb-4">
                    {feeds.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 text-center opacity-70">
                            <AlertCircle size={36} className="text-cyan-500 mb-3 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]" />
                            <p className="text-gray-300 text-sm font-medium">Conectate a la red.</p>
                            <p className="text-cyan-500/60 text-xs mt-1">Añade una fuente RSS arriba.</p>
                        </div>
                    ) : (
                        feeds.map((feed) => (
                            <FeedItem key={feed._id} feed={feed} onRemove={removeFeed} />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
