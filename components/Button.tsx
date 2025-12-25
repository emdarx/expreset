import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'glass';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false, 
  className = '', 
  ...props 
}) => {
  const baseStyles = "py-3.5 px-6 rounded-2xl font-bold transition-all duration-300 active:scale-95 flex items-center justify-center gap-2 shadow-lg backdrop-blur-sm";
  
  const variants = {
    primary: "bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 text-white shadow-indigo-500/30 border border-white/10",
    secondary: "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-emerald-500/30 border border-white/10",
    outline: "border-2 border-white/30 text-white hover:bg-white/10",
    glass: "bg-white/10 text-white border border-white/20 hover:bg-white/20 shadow-xl"
  };

  const widthClass = fullWidth ? "w-full" : "";

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${widthClass} ${className}`} 
      {...props}
    >
      {children}
    </button>
  );
};