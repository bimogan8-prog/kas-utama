
import React from 'react';
import { LogOut, User as UserIcon, Database, Cloud } from 'lucide-react';
import { User } from '../types';

interface LayoutProps {
  user: User;
  onLogout: () => void;
  children: React.ReactNode;
  title: string;
}

const Layout: React.FC<LayoutProps> = ({ user, onLogout, children, title }) => {
  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto bg-gray-50 shadow-2xl relative">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-blue-600 text-white p-5 shadow-lg flex justify-between items-center rounded-b-[2.5rem]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
            <UserIcon size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight leading-none">{title}</h1>
            <div className="flex items-center gap-1.5 text-[10px] text-blue-100 font-bold uppercase tracking-wider mt-1 opacity-80">
               <span>{user.name}</span>
               <span className="w-1 h-1 bg-blue-300 rounded-full"></span>
               <span>{user.role}</span>
            </div>
          </div>
        </div>
        <button 
          onClick={onLogout}
          className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all active:scale-90"
        >
          <LogOut size={20} />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-5 pb-24 overflow-y-auto space-y-6">
        {children}
      </main>

      {/* Persistent Badge & Info */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-[calc(100%-40px)] flex flex-col items-center gap-2 pointer-events-none">
        <div className="px-5 py-2.5 bg-gray-900/90 backdrop-blur-md text-white rounded-2xl shadow-2xl border border-white/10 flex items-center gap-3">
          <div className="relative">
            <Database size={14} className="text-blue-400" />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full border border-gray-900"></div>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-400">Database Online</span>
            <span className="text-[8px] text-gray-400 font-medium">Data tersinkron otomatis antar HP</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Layout;
