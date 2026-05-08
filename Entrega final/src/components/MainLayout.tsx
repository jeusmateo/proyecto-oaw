import { memo } from 'react';
import { useStore } from '@nanostores/react';
import { isSidebarOpen } from '../store/uiStore';
import FeedManager from '../components/FeedManager';
import ArticleList from '../components/ArticleList';

const SectionHeader = memo(function SectionHeader() {
    return (
        <div className="flex items-center gap-4 mb-8">
            <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">
                <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500 shadow-[0_0_10px_#22d3ee]"></span>
                </span>
                Últimas Noticias
            </h2>
            <div className="h-px bg-gradient-to-r from-cyan-500/50 via-fuchsia-500/30 to-transparent flex-1 shadow-[0_0_5px_rgba(217,70,239,0.5)]"></div>
        </div>
    );
});

export default function MainLayout() {
    const open = useStore(isSidebarOpen);

    return (
        <main className="flex-1 flex flex-col lg:flex-row gap-8 lg:gap-12 relative w-full h-full transition-all duration-500 z-10">

            {/* Sidebar Container */}
            <aside
                className={`shrink-0 transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) lg:h-[calc(100vh-8rem)] ${open ? 'w-full lg:w-4/12 xl:w-3/12' : 'w-full lg:w-[88px]'
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
                <SectionHeader />
                <ArticleList />
            </section>

        </main>
    );
}
