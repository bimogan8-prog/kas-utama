import React, { useEffect, useState } from 'react';
import { LogOut, User as UserIcon } from 'lucide-react';
import { User } from '../types';

interface LayoutProps {
  user: User;
  onLogout: () => void;
  children: React.ReactNode;
  title: string;
}

const Layout: React.FC<LayoutProps> = ({ user, onLogout, children, title }) => {
  const [statusBarHeight, setStatusBarHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    // Detect Android status bar height
    const checkStatusBar = () => {
      if (window.AndroidInterface && window.AndroidInterface.getStatusBarHeight) {
        const height = window.AndroidInterface.getStatusBarHeight();
        setStatusBarHeight(height);
      } else {
        // Fallback for web testing
        setStatusBarHeight(24);
      }
    };

    checkStatusBar();

    // Listen for Android keyboard events
    const handleResize = () => {
      const isKeyboard = window.innerHeight < document.documentElement.clientHeight * 0.75;
      setIsKeyboardVisible(isKeyboard);
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto bg-gray-50 shadow-2xl relative">
      {/* Android Status Bar Spacer */}
      {statusBarHeight > 0 && (
        <div 
          style={{ height: `${statusBarHeight}px` }}
          className="bg-blue-600"
        />
      )}
      
      {/* Header - Android Optimized */}
      <header 
        className={`sticky top-0 z-50 bg-blue-600 text-white shadow-lg flex justify-between items-center rounded-b-[2.5rem] transition-all duration-300 ${
          isKeyboardVisible ? 'py-2 px-4' : 'p-5'
        }`}
        style={{
          paddingTop: statusBarHeight > 0 ? '1.25rem' : '1.25rem',
          paddingBottom: isKeyboardVisible ? '0.5rem' : '1.25rem',
          paddingLeft: isKeyboardVisible ? '1rem' : '1.25rem', 
          paddingRight: isKeyboardVisible ? '1rem' : '1.25rem'
        }}
      >
        <div className="flex items-center gap-3 flex-1">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md touch-manipulation">
            <UserIcon size={22} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className={`font-black tracking-tight leading-none text-white ${
              isKeyboardVisible ? 'text-sm' : 'text-lg'
            }`}>{title}</h1>
            <div className="flex items-center gap-1.5 text-[9px] text-blue-100 font-bold uppercase tracking-wider mt-1 opacity-80 truncate">
               <span className="truncate">{user.name}</span>
               <span className="w-1 h-1 bg-blue-300 rounded-full flex-shrink-0"></span>
               <span className="flex-shrink-0">{user.role}</span>
            </div>
          </div>
        </div>
        
        <button 
          onClick={onLogout}
          className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all active:scale-90 touch-manipulation min-w-[48px] min-h-[48px] flex items-center justify-center"
          aria-label="Logout"
        >
          <LogOut size={20} />
        </button>
      </header>

      {/* Main Content - Android Optimized */}
      <main className={`flex-1 overflow-y-auto space-y-6 transition-all duration-300 ${
        isKeyboardVisible ? 'px-3 pb-3' : 'p-5 pb-10'
      }`}>
        <div className="touch-manipulation">
          {children}
        </div>
      </main>

      {/* Android Gesture Area Protection */}
      <div className="h-safe-bottom bg-gray-50" />
    </div>
  );
};

// Android types are imported from src/types/android.d.ts

export default Layout;
