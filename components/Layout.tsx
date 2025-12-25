import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-[100dvh] w-full bg-slate-950 text-slate-100 font-sans overflow-hidden relative selection:bg-indigo-500/30">
      {/* Background Animated Blobs */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/30 rounded-full blur-[100px] animate-pulse mix-blend-screen" />
        <div className="absolute top-[40%] right-[-10%] w-[400px] h-[400px] bg-purple-600/30 rounded-full blur-[100px] animate-pulse delay-1000 mix-blend-screen" />
        <div className="absolute bottom-[-10%] left-[20%] w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px] animate-pulse delay-2000 mix-blend-screen" />
        <div className="absolute top-[10%] right-[50%] w-[300px] h-[300px] bg-emerald-500/20 rounded-full blur-[90px] animate-pulse delay-1500 mix-blend-screen" />
      </div>

      {/* Mobile Frame Container */}
      <div className="relative z-10 max-w-md mx-auto h-[100dvh] flex flex-col bg-slate-900/40 backdrop-blur-sm border-x border-white/5 shadow-2xl">
        {children}
      </div>
    </div>
  );
};