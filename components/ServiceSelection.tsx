import React from 'react';
import { GlassCard } from './GlassCard';
import { VpnServiceType } from '../types';
import { Wifi, Globe, ChevronLeft } from 'lucide-react';
import { Button } from './Button';

interface ServiceSelectionProps {
  onSelect: (type: VpnServiceType) => void;
  selected: VpnServiceType;
  onNext: () => void;
}

export const ServiceSelection: React.FC<ServiceSelectionProps> = ({ onSelect, selected, onNext }) => {
  return (
    <div className="flex-1 flex flex-col p-6 animate-in slide-in-from-right duration-500">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">انتخاب نوع سرویس</h2>
        <p className="text-white/50 text-sm">لطفا تکنولوژی مورد نظر خود را انتخاب کنید</p>
      </div>

      <div className="space-y-4 flex-1">
        <GlassCard 
          onClick={() => onSelect('v2ray')}
          active={selected === 'v2ray'}
          className="p-5 cursor-pointer group"
        >
          <div className="flex items-center gap-4">
             {/* Selection Circle - Moved to Right (First in RTL) */}
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${selected === 'v2ray' ? 'border-indigo-500 bg-indigo-500' : 'border-white/30'}`}>
                {selected === 'v2ray' && <div className="w-2 h-2 bg-white rounded-full" />}
            </div>

            <div className={`p-4 rounded-2xl transition-colors duration-300 shrink-0 ${selected === 'v2ray' ? 'bg-indigo-600 shadow-lg shadow-indigo-500/40' : 'bg-white/10'}`}>
              <Wifi size={28} className="text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors">فیلترشکن V2RAY</h3>
              <p className="text-xs text-white/60 mt-1">سرعت بالا، مناسب اینستاگرام و یوتیوب</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard 
          onClick={() => onSelect('express')}
          active={selected === 'express'}
          className="p-5 cursor-pointer group"
        >
          <div className="flex items-center gap-4">
             {/* Selection Circle - Moved to Right (First in RTL) */}
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${selected === 'express' ? 'border-emerald-500 bg-emerald-500' : 'border-white/30'}`}>
                {selected === 'express' && <div className="w-2 h-2 bg-white rounded-full" />}
            </div>

            <div className={`p-4 rounded-2xl transition-colors duration-300 shrink-0 ${selected === 'express' ? 'bg-emerald-600 shadow-lg shadow-emerald-500/40' : 'bg-white/10'}`}>
              <Globe size={28} className="text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-white group-hover:text-emerald-300 transition-colors">اکسپرس VPN</h3>
              <p className="text-xs text-white/60 mt-1">آی‌پی ثابت، مناسب ترید و گیمینگ</p>
            </div>
          </div>
        </GlassCard>
      </div>

      <Button 
        onClick={onNext} 
        disabled={!selected} 
        fullWidth 
        className={`mt-6 ${!selected ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
      >
        <span className="ml-2">مرحله بعد</span>
        <ChevronLeft size={18} />
      </Button>
    </div>
  );
};