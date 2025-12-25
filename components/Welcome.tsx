
import React from 'react';
import { Button } from './Button';
import { GlassCard } from './GlassCard';
import { ShieldCheck, Zap, Rocket, ShoppingCart, TestTube, Send } from 'lucide-react';

interface WelcomeProps {
  onStart: () => void;
  onTestStart: () => void;
}

export const Welcome: React.FC<WelcomeProps> = ({ onStart, onTestStart }) => {
  return (
    <div className="flex-1 flex flex-col justify-end p-6 pb-8 gap-6 animate-in fade-in slide-in-from-bottom-10 duration-700 relative">
      
      {/* Telegram Support Label - Top */}
      <div className="absolute top-2 left-0 right-0 flex justify-center z-10">
        <a 
          href="https://t.me/ExpresetBot?start=true" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full text-xs font-bold shadow-[0_0_15px_rgba(16,185,129,0.15)] animate-scale-pulse hover:bg-emerald-500/20 transition-all hover:scale-105"
        >
          <Send size={14} />
          <span>میخوام با پشتیبانی تلگرام صحبت کنم</span>
        </a>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center gap-6 mt-12">
        <div className="relative">
          <div className="absolute inset-0 bg-indigo-500 blur-[60px] opacity-40 animate-pulse" />
          <Rocket size={120} className="text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)] relative z-10" strokeWidth={1} />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-blue-100 to-blue-400 drop-shadow-sm">
            دنیای اکسپرس
          </h1>
          <p className="text-lg text-white/70 font-medium">
            سرعت بی‌نهایت، آزادی بدون مرز
          </p>
        </div>
      </div>

      <GlassCard className="p-4 border-white/5 bg-white/5">
        <div className="flex justify-around items-center text-center">
            <div className="flex flex-col items-center gap-2">
                <div className="p-3 rounded-full bg-emerald-500/20 text-emerald-400">
                    <ShieldCheck size={24} />
                </div>
                <span className="text-xs text-white/80">امنیت بالا</span>
            </div>
            <div className="flex flex-col items-center gap-2">
                <div className="p-3 rounded-full bg-amber-500/20 text-amber-400">
                    <Zap size={24} />
                </div>
                <span className="text-xs text-white/80">اتصال فوری</span>
            </div>
            <div className="flex flex-col items-center gap-2">
                <div className="p-3 rounded-full bg-purple-500/20 text-purple-400">
                    <Rocket size={24} />
                </div>
                <span className="text-xs text-white/80">بدون قطعی</span>
            </div>
        </div>
      </GlassCard>

      <div className="space-y-4 w-full">
        <Button onClick={onStart} fullWidth className="text-lg shadow-[0_0_20px_rgba(79,70,229,0.4)]">
          <ShoppingCart size={22} className="ml-2" />
خرید فیلترشکن اختصاصی
        </Button>
        
        <div className="relative pt-2">
            {/* Red Animated Badge */}
            <span className="absolute -top-1 left-6 bg-gradient-to-r from-red-500 to-rose-600 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg z-10 animate-bounce border border-white/20">
                رایگان بگیر
            </span>
            <Button 
                onClick={onTestStart} 
                variant="glass" 
                fullWidth 
                className="text-lg w-full"
            >
                <TestTube size={22} className="ml-2" />
                دریافت فیلترشکن رایگان
            </Button>
        </div>
      </div>
    </div>
  );
};
