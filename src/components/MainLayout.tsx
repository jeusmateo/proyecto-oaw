import React from 'react';
import { useStore } from '@nanostores/react';
import { isSidebarOpen } from '../store/uiStore';
import FeedManager from '../components/FeedManager';
import ArticleList from '../components/ArticleList';

export default function MainLayout() {
    const open = useStore(isSidebarOpen);

    return (
        <main className="flex-1 flex flex-col lg:flex-row gap-8 lg:gap-12 relative w-full h-full transition-all duration-500">

            {/* Sidebar Container */}
            <aside
                className={`shrink-0 transition-all duration-500 ease-in-out lg:h-[calc(100vh-8rem)] ${open ? 'w-full lg:w-4/12 xl:w-3/12' : 'w-full lg:w-[80px]'
                    }`}
            >
                <div className="sticky top-8 lg:h-full z-40">
                    <FeedManager />
                </div>
            </aside>

            {/* Main Content Area */}
            <section
                className={`flex-1 transition-all duration-500 ease-in-out min-w-0 flex flex-col`}
            >
                <div className="flex items-center gap-4 mb-8">
                    <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-teal-500"></span>
                        </span>
                        Últimas Noticias
                    </h2>
                    <div className="h-px bg-gradient-to-r from-white/10 to-transparent flex-1"></div>
                </div>

                <ArticleList />
            </section>

        </main>
    );
}
