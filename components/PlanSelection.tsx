import React from 'react';
import { Plan, VpnServiceType } from '../types';
import { GlassCard } from './GlassCard';
import { Button } from './Button';
import { ChevronLeft, CheckCircle2, User, Clock, Smartphone, Download, ShieldCheck, Zap, AlertCircle } from 'lucide-react';

interface PlanSelectionProps {
  serviceType: VpnServiceType;
  selectedPlan: Plan | null;
  onSelectPlan: (plan: Plan) => void;
  onNext: () => void;
}

const v2rayPlans: Plan[] = [
  { id: 'v1', durationLabel: '۱ ماهه', userCount: 2, price: 150000, formattedPrice: '۱۵۰,۰۰۰' },
  { id: 'v2', durationLabel: '۳ ماهه', userCount: 4, price: 350000, formattedPrice: '۳۵۰,۰۰۰', badge: 'پیشنهاد اقتصادی' },
  { id: 'v3', durationLabel: '۶ ماهه', userCount: 4, price: 500000, formattedPrice: '۵۰۰,۰۰۰' },
  { id: 'v4', durationLabel: '۱۲ ماهه', userCount: 6, price: 999000, formattedPrice: '۹۹۹,۰۰۰', badge: 'ویژه حرفه‌ای‌ها' },
];

const expressPlans: Plan[] = [
    { id: 'e1', durationLabel: '۱ ماهه', userCount: 1, price: 199000, formattedPrice: '۱۹۹,۰۰۰' },
    { id: 'e2', durationLabel: '۱۲ ماهه', userCount: 2, price: 999000, formattedPrice: '۹۹۹,۰۰۰' },
];

export const PlanSelection: React.FC<PlanSelectionProps> = ({ 
  serviceType, 
  selectedPlan, 
  onSelectPlan, 
  onNext 
}) => {
  const plans = serviceType === 'v2ray' ? v2rayPlans : expressPlans;
  const isV2ray = serviceType === 'v2ray';

  // Configuration for dynamic content
  const content = isV2ray ? {
    title: '🚀 سرویس ویتوری پلاس',
    logo: 'https://i.ibb.co/PG6Tb7qQ/v2ray.png',
    features: [
      { text: 'حجم نامحدود', icon: CheckCircle2, color: 'text-emerald-400' },
      { text: 'نصب آسان', icon: Download, color: 'text-blue-400' },
      { text: 'موبایل و ویندوز', icon: Smartphone, color: 'text-purple-400' },
    ],
    descriptionPoints: [
      'پرسرعت، بدون محدودیت حجمی',
      'لینک اشتراک با ۱۵ لوکیشن آیپی ثابت',
      'رفع تحریم تمام سرویس‌های بین‌المللی',
      'افزایش سرعت دانلود و آپلود'
    ]
  } : {
    title: '🌐 سرویس اکسپرس',
    logo: 'https://i.ibb.co/39bHbfYC/express.webp',
    features: [
      { text: 'امنیت فوق‌العاده', icon: ShieldCheck, color: 'text-emerald-400' },
      { text: 'اتصال فوری', icon: Zap, color: 'text-amber-400' },
      { text: 'موبایل', icon: Smartphone, color: 'text-purple-400' },
    ],
    descriptionPoints: [
      'امنیت بسیار بالا و رمزنگاری پیشرفته',
      'مناسب برای ترید و کارهای حساس بانکی',
      'دارای آی‌پی ثابت اختصاصی',
      'پایداری بالا و بدون قطعی'
    ]
  };

  return (
    <div className="flex-1 flex flex-col animate-in slide-in-from-right duration-500 h-full overflow-hidden">
      
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-6 pb-24">
        
        {/* Banner Section */}
        <div className="mb-6 relative">
          <GlassCard className="p-5 !bg-gradient-to-br from-indigo-600/40 to-purple-800/40 border-indigo-400/30">
             <div className="flex items-start justify-between mb-4">
               <div className="flex-1 pl-2">
                 <h2 className="text-xl font-bold text-white mb-3">
                   {content.title}
                 </h2>
                 <ul className="space-y-1.5">
                    {content.descriptionPoints.map((point, index) => (
                        <li key={index} className="text-xs text-indigo-100 flex items-start gap-2 leading-relaxed">
                            <span className="w-1.5 h-1.5 bg-indigo-300 rounded-full mt-1.5 shrink-0"></span>
                            <span>{point}</span>
                        </li>
                    ))}
                 </ul>
               </div>
               
               <div className="w-16 h-16 rounded-full bg-white/10 p-1 shrink-0 border-2 border-white/20 shadow-lg overflow-hidden">
                   <img src={content.logo} alt="Logo" className="w-full h-full object-cover rounded-full" />
               </div>
             </div>

             {/* Features Labels - Single Line */}
             <div className="flex flex-nowrap gap-2 pt-2 border-t border-white/10 mt-2 overflow-x-auto no-scrollbar whitespace-nowrap mask-linear-gradient">
                {content.features.map((item, idx) => (
                    <span key={idx} className="px-3 py-1.5 rounded-xl bg-white/10 text-[10px] text-white flex items-center gap-1.5 border border-white/10 shrink-0">
                        <item.icon size={12} className={item.color} />
                        {item.text}
                    </span>
                ))}
             </div>
          </GlassCard>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 gap-4">
          {plans.map((plan) => (
            <div key={plan.id} className="relative group" onClick={() => onSelectPlan(plan)}>
                {plan.badge && (
                    <span className="absolute -top-3 left-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg z-10 animate-bounce">
                        {plan.badge}
                    </span>
                )}
                <GlassCard 
                    active={selectedPlan?.id === plan.id}
                    className="p-4 transition-all duration-300"
                >
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                             {/* Selection Circle - Right (First in RTL) */}
                             <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${selectedPlan?.id === plan.id ? 'border-indigo-500 bg-indigo-500' : 'border-white/30'}`}>
                                {selectedPlan?.id === plan.id && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                             </div>

                             <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                    <Clock size={16} className="text-indigo-300" />
                                    <span className="font-bold text-lg text-white">{plan.durationLabel}</span>
                                    
                                    {/* User Count Badge */}
                                    <span className="mr-2 px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-[11px] font-medium border border-emerald-500/30 flex items-center gap-1">
                                        <User size={10} />
                                        {plan.userCount} کاربر
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="text-left">
                            <div className="text-xl font-bold text-emerald-400 font-sans tracking-tight">
                                {plan.formattedPrice}
                            </div>
                            <div className="text-[10px] text-white/40 text-right">تومان</div>
                        </div>
                    </div>
                </GlassCard>
            </div>
          ))}
        </div>

        {/* ExpressVPN Disclaimer */}
        {!isV2ray && (
            <div className="mt-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl p-3 flex gap-3 items-start animate-in fade-in slide-in-from-bottom-2">
                 <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={18} />
                 <p className="text-[11px] text-amber-200/80 leading-relaxed text-justify">
                    با خرید این محصول، شما تایید می کنید که در صورت بروز اختلال در سرور های ExpressVPN و عدم امکان تحویل مستقیم ایمیل پسورد، کانفیگ های اوریجنال Express
                    در قالب V2Ray برای شما ارسال خواهد شد.
                 </p>
            </div>
        )}

      </div>

      {/* Sticky Bottom Bar */}
      <div className="absolute bottom-0 left-0 right-0 p-6 pt-4 bg-gradient-to-t from-slate-900 via-slate-900/90 to-transparent z-20">
         <Button 
            onClick={onNext} 
            disabled={!selectedPlan} 
            fullWidth 
            className={`shadow-xl ${!selectedPlan ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
            variant="primary"
        >
            <span className="ml-2">مرحله بعد</span>
            <ChevronLeft size={18} />
        </Button>
      </div>
    </div>
  );
};