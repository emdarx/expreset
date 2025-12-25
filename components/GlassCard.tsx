import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  active?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({ 
  children, 
  className = '', 
  onClick,
  active = false
}) => {
  const activeStyles = active 
    ? "bg-white/20 border-blue-400/50 shadow-blue-500/20 scale-[1.02]" 
    : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 shadow-black/20";

  return (
    <div 
      onClick={onClick}
      className={`
        relative overflow-hidden backdrop-blur-md rounded-3xl border transition-all duration-300
        ${activeStyles}
        ${className}
      `}
    >
      {/* Glossy reflection effect */}
      <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
      
      {children}
    </div>
  );
};