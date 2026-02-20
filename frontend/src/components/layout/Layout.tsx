import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { Sidebar } from './Sidebar';

export const Layout = () => {
    const location = useLocation();
    const isLanding = location.pathname === '/';
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen flex flex-col relative bg-noise bg-bg-primary overflow-hidden">
            <div className="fixed inset-0 pointer-events-none opacity-20 transition-opacity duration-1000 z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-accent-saffron blur-[150px] opacity-30" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-accent-teal blur-[150px] opacity-20" />
            </div>

            <Navbar onMenuClick={() => setSidebarOpen(true)} showMenuBtn={!isLanding} />

            <div className="flex flex-1 relative z-10 mx-auto w-full max-w-[1600px]">
                {!isLanding && <Sidebar isOpen={sidebarOpen} setOpen={setSidebarOpen} />}

                <div className="flex flex-col flex-1 min-w-0">
                    <main className="flex-grow w-full relative">
                        <Outlet />
                    </main>
                    {isLanding && <Footer />}
                </div>
            </div>
        </div>
    );
};
