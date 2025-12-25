import React, { useEffect, useRef, useState } from 'react';
import { GlassCard } from './GlassCard';
import { Button } from './Button';
import { Timer, CheckCircle2, UploadCloud, Loader2, Home, XCircle } from 'lucide-react';
import { Plan, VpnServiceType, ContactType } from '../types';

interface PaymentProps {
  plan: Plan | null;
  service: VpnServiceType;
  finalPriceRial: number | null;
  setFinalPriceRial: (price: number) => void;
  selectedCardIndex: number | null;
  setSelectedCardIndex: (index: number) => void;
  contactInfo: string;
  contactType: ContactType;
  onReturnToHome: () => void;
}

const CARDS = [
  { number: '6037991218462194', name: 'امیر حمزه علی', bank: 'بانک ملی', logo: 'https://ibrank.ir/images/banks/5.png' },
  { number: '6063731266506832', name: 'امیر حمزه علی', bank: 'بانک قرض الحسنه مهر', logo: 'https://sbbiran.ir/wp-content/uploads/2022/02/Mehr-e-Iran-Bank.png' },
  { number: '6037991220219897', name: 'امیر حمزه علی', bank: 'بانک ملی', logo: 'https://ibrank.ir/images/banks/5.png' },
  { number: '6063731267499615', name: 'امیر حمزه علی', bank: 'بانک قرض الحسنه مهر', logo: 'https://sbbiran.ir/wp-content/uploads/2022/02/Mehr-e-Iran-Bank.png' },
  { number: '6393461058665585', name: 'امیر حمزه علی', bank: 'بانک سینا', logo: 'https://ibrank.ir/images/banks/18.png' },
  { number: '6393461066482189', name: 'امیر حمزه علی', bank: 'بانک سینا', logo: 'https://ibrank.ir/images/banks/18.png' },
];

// Safely access env variables
const TELEGRAM_BOT_TOKEN = (import.meta as any).env?.VITE_TELEGRAM_BOT_TOKEN || "";
const TARGET_CHAT_ID = '1110189433';

export const Payment: React.FC<PaymentProps> = ({ 
  plan, 
  service, 
  finalPriceRial, 
  setFinalPriceRial,
  selectedCardIndex,
  setSelectedCardIndex,
  contactInfo,
  contactType,
  onReturnToHome
}) => {
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const [success, setSuccess] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [copiedPrice, setCopiedPrice] = useState(false);
  const [copiedCard, setCopiedCard] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Use a ref for the end time to ensure accuracy even if browser throttles background tabs
  const endTimeRef = useRef(Date.now() + 600 * 1000);

  const card = selectedCardIndex !== null && CARDS[selectedCardIndex] ? CARDS[selectedCardIndex] : CARDS[0];

  useEffect(() => {
    if (selectedCardIndex === null) {
        const randomIndex = Math.floor(Math.random() * CARDS.length);
        setSelectedCardIndex(randomIndex);
    }

    if (!finalPriceRial && plan) {
        const baseRial = plan.price * 10; // Convert Toman to Rial
        // Add random amount between 1000 and 9999 Rials
        const randomAdd = Math.floor(Math.random() * (9999 - 1000 + 1) + 1000);
        setFinalPriceRial(baseRial + randomAdd);
    }
  }, [selectedCardIndex, finalPriceRial, plan, setSelectedCardIndex, setFinalPriceRial]);

  useEffect(() => {
    if (success) return;
    
    const interval = setInterval(() => {
      const now = Date.now();
      const distance = endTimeRef.current - now;
      const seconds = Math.floor(distance / 1000);
      
      if (seconds <= 0) {
        setTimeLeft(0);
        clearInterval(interval);
      } else {
        setTimeLeft(seconds);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [success]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCard(true);
    setTimeout(() => setCopiedCard(false), 2000);
  };

  const copyPrice = () => {
    if (finalPriceRial) {
        navigator.clipboard.writeText(finalPriceRial.toString());
        setCopiedPrice(true);
        setTimeout(() => setCopiedPrice(false), 2000);
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
        const caption = `
🧾 *رسید پرداخت جدید*

👤 کاربر: ${contactInfo}
📱 نوع تماس: ${contactType === 'email' ? 'ایمیل' : 'اینستاگرام'}
📅 تاریخ: ${new Date().toLocaleString('fa-IR')}
🛍 سفارش: ${service === 'v2ray' ? 'V2Ray' : 'Express'} - ${plan?.durationLabel}
💰 مبلغ: ${finalPriceRial?.toLocaleString('fa-IR')} ریال
        `.trim();

        const formData = new FormData();
        formData.append('chat_id', TARGET_CHAT_ID);
        formData.append('photo', file);
        formData.append('caption', caption);
        
        // Ensure token exists
        if (!TELEGRAM_BOT_TOKEN) {
            console.warn('Telegram Token not found in env vars');
        }

        const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`, {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            setSuccess(true);
        } else {
             // If the token is invalid or request fails
             if (!TELEGRAM_BOT_TOKEN || TELEGRAM_BOT_TOKEN.length < 10) {
                 // Demo fallback
                 setSuccess(true);
             } else {
                 alert('خطا در ارسال رسید. لطفا مجدد تلاش کنید.');
             }
        }
    } catch (error) {
        console.error('Upload error:', error);
        if (!TELEGRAM_BOT_TOKEN || TELEGRAM_BOT_TOKEN.length < 10) {
             setSuccess(true);
        } else {
            alert('خطا در برقراری ارتباط با سرور.');
        }
    } finally {
        setUploading(false);
    }
  };

  if (success) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-in zoom-in duration-500">
            <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(16,185,129,0.4)] animate-bounce">
                <CheckCircle2 size={48} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">پرداخت با موفقیت ثبت شد</h2>
            <p className="text-white/70 mb-8 max-w-[280px] leading-relaxed">
                سفارش شما دریافت شد. <br/>
                اطلاعات اشتراک تا لحظاتی دیگر به {contactType === 'email' ? 'ایمیل' : 'اینستاگرام'} شما ارسال خواهد شد.
            </p>
            <Button onClick={onReturnToHome} fullWidth className="max-w-xs shadow-xl">
                <Home size={20} className="ml-2" />
                بازگشت به خانه
            </Button>
        </div>
      );
  }

  if (timeLeft === 0) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-in zoom-in duration-500">
            <div className="w-24 h-24 bg-rose-500 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(244,63,94,0.4)] animate-pulse">
                <XCircle size={48} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">زمان پرداخت به پایان رسید</h2>
            <p className="text-white/70 mb-8 max-w-[280px] leading-relaxed">
                مهلت پرداخت شما تمام شده است. <br/>
                لطفا برای تلاش مجدد به صفحه اصلی بازگردید.
            </p>
            <Button onClick={onReturnToHome} fullWidth className="max-w-xs shadow-xl bg-rose-600 hover:bg-rose-700 border-rose-400/30">
                <Home size={20} className="ml-2" />
                بازگشت به خانه
            </Button>
        </div>
      );
  }

  return (
    <div className="flex-1 flex flex-col p-4 animate-in slide-in-from-right duration-500 h-full overflow-hidden">
        
        {/* Timer Bar - Reduced margin */}
        <div className="flex items-center justify-between mb-3 bg-white/5 p-3 rounded-2xl border border-white/10 shrink-0">
            <span className="text-xs text-white/60">زمان باقی‌مانده:</span>
            <div className="flex items-center gap-2 text-amber-400 font-mono font-bold text-lg">
                <Timer size={18} />
                {formatTime(timeLeft)}
            </div>
        </div>

        {/* Content Container - Centered - Reduced Gap */}
        <div className="flex-1 flex flex-col gap-2 justify-center">
            
            {/* Price Card */}
            <GlassCard className="p-3 flex flex-col items-center justify-center border-emerald-500/30 bg-emerald-500/5 w-full">
                <span className="text-xs text-emerald-200/70 mb-1">مبلغ دقیق قابل پرداخت</span>
                <div 
                    onClick={copyPrice}
                    className="flex items-center gap-3 cursor-pointer active:scale-95 transition-transform"
                >
                    <span className="text-3xl font-black text-white tracking-tight drop-shadow-sm">
                        {finalPriceRial?.toLocaleString('fa-IR')}
                    </span>
                    <span className="text-xs text-emerald-400 font-bold bg-emerald-400/10 px-2 py-1 rounded-lg border border-emerald-400/20">
                        ریال
                    </span>
                </div>
                <div className="text-[10px] text-white/40 mt-2">
                    {copiedPrice ? 'کپی شد!' : 'برای کپی مبلغ ضربه بزنید'}
                </div>
            </GlassCard>

            {/* Bank Card - Compacted */}
            <GlassCard className="p-3 relative overflow-hidden group w-full">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-purple-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="flex justify-between items-center mb-2 relative z-10">
                    <div className="flex items-center gap-3">
                         {/* Bank Logo */}
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center p-1.5 shadow-md">
                            <img src={card.logo} alt={card.bank} className="w-full h-full object-contain" />
                        </div>
                        <span className="text-sm font-bold text-white/90">{card.bank}</span>
                    </div>
                </div>

                <div className="space-y-1 relative z-10">
                    <div 
                        onClick={() => copyToClipboard(card.number)}
                        className="text-center py-0 cursor-pointer"
                    >
                        <div dir="ltr" className="text-xl font-mono font-bold text-white tracking-widest drop-shadow-md tabular-nums">
                            {card.number.match(/.{1,4}/g)?.join('  ')}
                        </div>
                        <span className="text-[10px] text-indigo-300 mt-1 block">
                            {copiedCard ? 'شماره کارت کپی شد' : 'برای کپی ضربه بزنید'}
                        </span>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-white/10 mt-1">
                        <span className="text-xs text-white/50">نام صاحب کارت:</span>
                        <span className="text-sm font-bold text-white">{card.name}</span>
                    </div>
                </div>
            </GlassCard>

            {/* Warning Text - Compacted */}
            <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-2">
                 <p className="text-[11px] text-amber-200/80 leading-relaxed text-center">
                    ⚠️ مبلغ را <b>دقیقاً</b> همان عدد بالا واریز کنید تا تایید سیستمی انجام شود.
                    <br/>
                    از نوشتن عباراتی مانند VPN در توضیحات بانک خودداری کنید.
                 </p>
            </div>

        </div>

        {/* Bottom Action */}
        <div className="mt-auto pt-2 shrink-0">
            <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
            />
            <Button 
                onClick={() => fileInputRef.current?.click()} 
                fullWidth 
                disabled={uploading}
                className={`shadow-[0_0_20px_rgba(79,70,229,0.3)] h-12 text-base ${uploading ? 'opacity-80' : ''}`}
            >
                {uploading ? (
                    <>
                        <Loader2 className="animate-spin ml-2" size={20} />
                        در حال ارسال...
                    </>
                ) : (
                    <>
                        <UploadCloud size={20} className="ml-2" />
                        ارسال رسید و تکمیل خرید
                    </>
                )}
            </Button>
        </div>
    </div>
  );
};