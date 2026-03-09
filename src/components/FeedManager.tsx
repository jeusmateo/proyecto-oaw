import React, { useState, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { isSidebarOpen } from '../store/uiStore';
import { Rss, Plus, Trash2, RefreshCw, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';

export default function FeedManager() {
    const [feeds, setFeeds] = useState<any[]>([]);
    const [newUrl, setNewUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [syncing, setSyncing] = useState(false);

    // Use global store
    const isOpen = useStore(isSidebarOpen);

    useEffect(() => {
        fetchFeeds();
    }, []);

    const fetchFeeds = async () => {
        const res = await fetch('/api/feeds');
        const data = await res.json();
        setFeeds(data);
    };

    const addFeed = async (e: React.FormEvent) => {
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
    };

    const syncFeeds = async () => {
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
    };

    const removeFeed = async (id: string) => {
        if (!confirm('¿Estás seguro de que deseas eliminar este feed y todas sus noticias?')) return;
        await fetch(`/api/feeds/${id}`, { method: 'DELETE' });
        fetchFeeds();
        window.dispatchEvent(new Event('feedsUpdated'));
    };

    return (
        <div
            className={`bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl flex flex-col relative group transition-all duration-500 ease-in-out origin-top shrink-0 ${isOpen ? 'h-full p-6 w-full opacity-100 overflow-hidden' : 'h-[80px] p-4 w-full md:w-[80px] overflow-hidden'}`}
        >
            {/* Decorative gradient background */}
            <div className={`absolute top-0 right-0 bg-teal-500/10 rounded-full blur-3xl -z-10 transition-all duration-700 ${isOpen ? 'w-32 h-32 group-hover:bg-teal-500/20' : 'w-16 h-16'}`}></div>

            <div
                className={`flex items-center relative z-10 transition-all duration-300 ${isOpen ? 'justify-between mb-8' : 'justify-center w-full h-full cursor-pointer hover:scale-105'}`}
                onClick={() => !isOpen && isSidebarOpen.set(true)}
            >
                <div className={`flex items-center gap-3 transition-all duration-300 ${isOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-full absolute pointer-events-none'}`}>
                    <div className="p-2 bg-teal-500/20 rounded-lg text-teal-400">
                        <Rss size={24} />
                    </div>
                    <h2 className="text-xl font-bold text-white tracking-tight whitespace-nowrap">Tus Fuentes</h2>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={(e) => { e.stopPropagation(); isSidebarOpen.set(true); }}
                        className={`text-gray-400 hover:text-emerald-400 hover:bg-emerald-400/10 p-2 rounded-lg transition-all duration-300 disabled:opacity-50 flex items-center justify-center ${isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-50 absolute pointer-events-none'}`}
                        title="Sincronizar fuentes"
                    >
                        <RefreshCw size={20} className={syncing ? "animate-spin text-emerald-400" : ""} />
                    </button>

                    <button
                        onClick={(e) => { e.stopPropagation(); isSidebarOpen.set(!isOpen); }}
                        className={`p-2 rounded-lg transition-all duration-300 flex items-center justify-center ${isOpen ? 'text-gray-400 hover:bg-white/10 hover:text-white' : 'text-teal-400 hover:bg-teal-500/20 bg-teal-500/10'}`}
                        title={isOpen ? "Ocultar fuentes" : "Mostrar fuentes"}
                    >
                        {isOpen ? (
                            <ChevronLeft size={20} />
                        ) : <Rss size={24} className="animate-pulse" />}
                    </button>
                </div>
            </div>

            <div className={`flex flex-col flex-1 w-full transition-all duration-500 ease-in-out ${isOpen ? 'opacity-100 translate-y-0 visible' : 'opacity-0 -translate-y-8 invisible hidden'}`}>
                <form onSubmit={addFeed} className="relative mb-8 z-10 shrink-0">
                    <div className="relative w-full">
                        <input
                            type="url"
                            value={newUrl}
                            onChange={(e) => setNewUrl(e.target.value)}
                            placeholder="https://ejemplo.com/rss.xml"
                            className="w-full bg-black/40 border border-white/10 rounded-xl pl-4 pr-12 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-transparent transition-all"
                            required
                        />
                        <button
                            type="submit"
                            disabled={loading}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-teal-500 hover:bg-teal-400 text-white rounded-lg transition-colors disabled:opacity-50"
                        >
                            {loading ? <RefreshCw size={18} className="animate-spin" /> : <Plus size={18} />}
                        </button>
                    </div>
                </form>

                <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar z-10 pr-2 pb-4">
                    {feeds.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 text-center opacity-70">
                            <AlertCircle size={32} className="text-gray-500 mb-3" />
                            <p className="text-gray-400 text-sm">No has añadido ninguna fuente aún.</p>
                        </div>
                    ) : (
                        feeds.map((feed) => (
                            <div key={feed._id} className="group/item flex justify-between items-center p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20 transition-all duration-300 relative overflow-hidden">
                                <div className="flex-1 min-w-0 pr-4 relative z-10">
                                    <h3 className="text-gray-200 font-medium truncate text-sm mb-1">{feed.title || feed.url}</h3>
                                    <p className="text-xs text-teal-400/70 truncate">{feed.url.replace(/^https?:\/\//, '')}</p>
                                </div>
                                <button
                                    onClick={() => removeFeed(feed._id)}
                                    className="opacity-0 group-hover/item:opacity-100 text-red-400/70 hover:text-red-400 hover:bg-red-400/10 p-2 rounded-lg transition-all duration-300 z-10"
                                    title="Eliminar fuente"
                                >
                                    <Trash2 size={18} />
                                </button>

                                {/* Card hover effect */}
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover/item:animate-[shimmer_1s_infinite] pointer-events-none"></div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
