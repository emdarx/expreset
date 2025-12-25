import React from 'react';
import { GlassCard } from './GlassCard';
import { Button } from './Button';
import { ChevronLeft, Mail, Instagram, AlertCircle } from 'lucide-react';
import { ContactType } from '../types';

interface ContactMethodProps {
  contactType: ContactType;
  contactInfo: string;
  onTypeChange: (type: ContactType) => void;
  onInfoChange: (info: string) => void;
  onNext: () => void;
}

export const ContactMethod: React.FC<ContactMethodProps> = ({
  contactType,
  contactInfo,
  onTypeChange,
  onInfoChange,
  onNext
}) => {
  
  const validateEmail = (email: string) => {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };

  const isValid = contactType === 'email' 
    ? validateEmail(contactInfo) 
    : contactInfo.trim().length > 2;

  return (
    <div className="flex-1 flex flex-col p-6 animate-in slide-in-from-right duration-500">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">اطلاعات کاربری</h2>
        <p className="text-white/50 text-sm">اشتراک شما به این آدرس ارسال خواهد شد</p>
      </div>

      <div className="flex-1 space-y-6">
        {/* Tabs */}
        <div className="flex p-1 bg-white/5 rounded-2xl border border-white/10">
          <button
            onClick={() => onTypeChange('email')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${
              contactType === 'email'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                : 'text-white/50 hover:text-white/80'
            }`}
          >
            <Mail size={18} />
            ایمیل
          </button>
          <button
            onClick={() => onTypeChange('instagram')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all duration-300 ${
              contactType === 'instagram'
                ? 'bg-pink-600 text-white shadow-lg shadow-pink-500/20'
                : 'text-white/50 hover:text-white/80'
            }`}
          >
            <Instagram size={18} />
            اینستاگرام
          </button>
        </div>

        {/* Input Area */}
        <GlassCard className="p-6">
          <div className="space-y-4">
            <label className="text-sm text-white/70 block">
              {contactType === 'email' ? 'آدرس ایمیل خود را وارد کنید' : 'آیدی اینستاگرام خود را وارد کنید'}
            </label>
            <div className="relative">
              <input
                type="text"
                value={contactInfo}
                onChange={(e) => onInfoChange(e.target.value)}
                placeholder={contactType === 'email' ? 'example@gmail.com' : '@username'}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-white placeholder-white/20 focus:outline-none focus:border-indigo-500 focus:bg-white/10 transition-all text-left"
                dir="ltr"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30">
                {contactType === 'email' ? <Mail size={20} /> : <Instagram size={20} />}
              </div>
            </div>
            
            <div className="flex items-start gap-2 text-[11px] text-amber-200/80 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
              <AlertCircle size={14} className="mt-0.5 shrink-0" />
              <span>
                {contactType === 'email' 
                    ? 'لطفا ایمیل صحیح را وارد کنید. لینک اشتراک و راهنما به این ایمیل ارسال می‌شود.' 
                    : 'لطفا آیدی اینستاگرام را صحیح وارد کنید. لینک اشتراک و راهنما به این آیدی ارسال می‌شود.'}
              </span>
            </div>
          </div>
        </GlassCard>
      </div>

      <Button
        onClick={onNext}
        disabled={!isValid}
        fullWidth
        className={`mt-6 ${!isValid ? 'opacity-50 cursor-not-allowed' : 'shadow-[0_0_20px_rgba(79,70,229,0.3)]'}`}
      >
        <span className="ml-2">مرحله بعد</span>
        <ChevronLeft size={18} />
      </Button>
    </div>
  );
};