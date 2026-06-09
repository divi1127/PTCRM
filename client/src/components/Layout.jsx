import { useState, useEffect, useCallback } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import BottomNav from './BottomNav';

export default function Layout({ children, title, hideNavbar = false }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  /* Track screen size */
  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth <= 1024;
      setIsMobile(mobile);
      setIsSidebarOpen(!mobile);
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const toggleSidebar = useCallback(() => setIsSidebarOpen(v => !v), []);

  /* Close sidebar on mobile when backdrop clicked */
  const closeSidebar = useCallback(() => {
    if (isMobile) setIsSidebarOpen(false);
  }, [isMobile]);

  /* Prevent body scroll when sidebar is open on mobile */
  useEffect(() => {
    if (isMobile && isSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isMobile, isSidebarOpen]);

  const sidebarClass = isMobile
    ? (isSidebarOpen ? 'open' : '')
    : (isSidebarOpen ? '' : 'closed');

  const mainClass = `main-layout${!isSidebarOpen && !isMobile ? ' full' : ''}`;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-dark)' }}>

      {/* Sidebar backdrop (mobile only) */}
      {isMobile && isSidebarOpen && (
        <div
          className="sidebar-backdrop visible"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      <Sidebar
        isOpen={isSidebarOpen}
        sidebarClass={sidebarClass}
        toggleSidebar={toggleSidebar}
      />

      <div
        className={mainClass}
        style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
      >
        {!hideNavbar && (
          <Navbar title={title} toggleSidebar={toggleSidebar} isSidebarOpen={isSidebarOpen} />
        )}
        <main
          className={`fade-in main-content-pad ${hideNavbar ? 'p-0' : 'p-6'}`}
          style={{ flex: 1, maxWidth: '100%', overflowX: 'hidden' }}
        >
          {children}
        </main>
      </div>

      {/* Mobile bottom nav (only renders on mobile via CSS display:flex) */}
      <BottomNav />
    </div>
  );
}
