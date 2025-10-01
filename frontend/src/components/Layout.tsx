import React, { ReactNode, useEffect, useState } from 'react';
import Navbar from './Navbar';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.pageYOffset > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <div className="app">
      <Navbar />
      {children}
      <button
        id="scrollToTop"
        className={`scroll-to-top ${showScrollTop ? 'visible' : ''}`}
        title="Наверх"
        onClick={scrollToTop}
      >
        <i className="fas fa-chevron-up"></i>
      </button>
    </div>
  );
};

export default Layout;
