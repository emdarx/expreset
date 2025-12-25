
import React, { useEffect, useState, useRef } from 'react';
import { GlassCard } from './GlassCard';
import { Button } from './Button';
import { 
  Loader2, CheckCircle2, Copy, ChevronDown, ChevronUp, 
  Home, Monitor, Download, Smartphone, Apple, ShieldCheck, 
  Clock, CalendarDays, ChevronRight, Info
} from 'lucide-react';

const GLOBAL_RESET_DATE = "2025-12-23";

const CF_EMAIL = "amdark77@gmail.com";
const CF_API_KEY = "990859427ef7a7dc0d1ce988126d2abdffd53";
const CF_ACCOUNT_ID = "b0afdfd4b33d9e520bd966a3e434abe6";
const KV_NAMESPACE_ID = "6eda059eed2c4454a35aadee9c167319";
const TARGET_CNAME = 'cf.aptic.ir';
const CORS_PROXY = "https://corsproxy.io/?";

const STORAGE_KEY_DATA = 'ew_secure_test_v4';
const STORAGE_SALT = "EXP_WORLD_SECURE_TOKEN_2024_";

const saveSecureData = (data: any) => {
    const stringData = JSON.stringify(data);
    const signature = btoa(STORAGE_SALT + stringData).slice(0, 32);
    const payload = btoa(JSON.stringify({ d: stringData, s: signature }));
    localStorage.setItem(STORAGE_KEY_DATA, payload);
};

const getSecureData = (): any | null => {
    const payload = localStorage.getItem(STORAGE_KEY_DATA);
    if (!payload) return null;
    try {
        const decoded = JSON.parse(atob(payload));
        const expectedSignature = btoa(STORAGE_SALT + decoded.d).slice(0, 32);
        if (decoded.s !== expectedSignature) {
            localStorage.removeItem(STORAGE_KEY_DATA);
            return null;
        }
        return JSON.parse(decoded.d);
    } catch (e) {
        return null;
    }
};

const DOMAINS_LIST = [
    { domain: "aptic.ir", zoneId: "26d0b00a76a66f702014eef0881b751d" },
    { domain: "smident.ir", zoneId: "e8e97daec2ff9f9ed2f1321690cf773f" },
    { domain: "goshime.ir", zoneId: "4fe611219e2ee6065929eae3927ef60b" },
    { domain: "mitsonic.ir", zoneId: "a88f3fa7f4946a5e8f32b524223a7fcb" },
];

const APP_LINKS = {
    v2rayng: "https://play.google.com/store/apps/details?id=com.v2ray.ang",
    v2boxAndroid: "https://play.google.com/store/apps/details?id=dev.v2box.android",
    v2boxIos: "https://apps.apple.com/us/app/v2box-v2ray-client/id1640135640",
    streisand: "https://apps.apple.com/us/app/streisand/id6450534064",
    hiddify: "https://github.com/hiddify/hiddify-next/releases/latest",
    v2rayn: "https://github.com/2dust/v2rayN/releases/latest"
};

const LOADING_MESSAGES = [
    "در حال برقراری ارتباط با دیتاسنتر ابری...",
    "در حال بررسی وضعیت پینگ و انتخاب بهترین مسیر...",
    "شما نفر {n} در صف اشتراک رایگان هستید...",
    "در حال بررسی شرایط اکانت شما...",
    "در حال رمزنگاری تانل اختصاصی...",
    "تایید هویت سخت‌افزاری دستگاه...",
    "در حال دریافت توکن امنیتی...",
    "آنالیز ترافیک شبکه...",
    "در حال ساخت کانفیگ اختصاصی...",
    "بهینه‌سازی برای اینترنت ایران...",
    "تخصیص آی‌پی تمیز از استخر خصوصی...",
    "ثبت درخواست در CDN ابری...",
    "نهایی‌سازی تنظیمات و ساخت لینک..."
];

interface FreeTestProps {
    onBack: () => void;
}

export const FreeTest: React.FC<FreeTestProps> = ({ onBack }) => {
    const [status, setStatus] = useState<'captcha' | 'loading' | 'success' | 'error' | 'blocked'>('loading');
    const [subLink, setSubLink] = useState<string>('');
    const [copied, setCopied] = useState(false);
    const [activeTutorial, setActiveTutorial] = useState<string | null>(null);
    const [errorDetail, setErrorDetail] = useState<string>('');
    const [currentMessage, setCurrentMessage] = useState<string>("");
    const [remainingDays, setRemainingDays] = useState<number>(0);
    const [expiryDateDisplay, setExpiryDateDisplay] = useState<string>('');
    
    const [captcha, setCaptcha] = useState({ num1: 0, num2: 0, userInput: '' });
    const [captchaError, setCaptchaError] = useState(false);
    
    const shouldStopSimulation = useRef(false);

    useEffect(() => {
        const checkEligibility = () => {
            let data = getSecureData();
            const now = new Date();

            if (data) {
                const nextDate = new Date(data.next);
                const createdDate = new Date(nextDate.getTime() - (14 * 24 * 60 * 60 * 1000));
                const resetThreshold = new Date(GLOBAL_RESET_DATE);

                if (createdDate < resetThreshold) {
                    localStorage.removeItem(STORAGE_KEY_DATA);
                    data = null;
                }
            }

            if (data) {
                const subExpDate = new Date(data.exp);
                const nextEligibleDate = new Date(data.next);

                if (now <= subExpDate) {
                    setSubLink(`https://link.${data.domain}/${data.id}`);
                    setExpiryDateDisplay(data.exp);
                    setStatus('success');
                    return;
                }

                if (now < nextEligibleDate) {
                    const diffTime = Math.abs(nextEligibleDate.getTime() - now.getTime());
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    setRemainingDays(diffDays);
                    setStatus('blocked');
                    return;
                }
            }

            initializeCaptcha();
        };

        checkEligibility();
        return () => { shouldStopSimulation.current = true; };
    }, []);

    const initializeCaptcha = () => {
        setCaptcha({
            num1: Math.floor(Math.random() * 8) + 2,
            num2: Math.floor(Math.random() * 8) + 2,
            userInput: ''
        });
        setStatus('captcha');
    };

    const handleCaptchaSubmit = (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (parseInt(captcha.userInput) === captcha.num1 + captcha.num2) {
            processTest();
        } else {
            setCaptchaError(true);
            setCaptcha(prev => ({ ...prev, userInput: '' }));
            setTimeout(() => setCaptchaError(false), 2000);
        }
    };

    const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    const processTest = async () => {
        setStatus('loading');
        shouldStopSimulation.current = false;
        setErrorDetail('');

        try {
            const queueNum = Math.floor(Math.random() * 12) + 2;
            const uniqueId = `test-${Math.random().toString(36).substring(2, 11)}`;
            
            const daysToAdd = Math.floor(Math.random() * 3) + 1;
            const expirationDate = new Date();
            expirationDate.setDate(expirationDate.getDate() + daysToAdd);
            const expStr = expirationDate.toISOString().split('T')[0];

            const nextEligible = new Date();
            nextEligible.setDate(nextEligible.getDate() + 14);

            const totalProcessTime = Math.floor(Math.random() * (14000 - 8000 + 1)) + 8000;
            
            // Start message loop
            const messageLoopPromise = (async () => {
                const startTime = Date.now();
                let loopCount = 0;

                while (true) {
                    if (shouldStopSimulation.current) break;

                    const elapsed = Date.now() - startTime;
                    const remaining = totalProcessTime - elapsed;
                    
                    if (remaining <= 0) break;

                    let msg = LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)];
                    if (loopCount === 0) msg = LOADING_MESSAGES[0]; 
                    if (loopCount === 1) msg = LOADING_MESSAGES[2].replace('{n}', queueNum.toString());

                    if (loopCount === 0 || remaining > 1000) {
                        setCurrentMessage(msg);
                        loopCount++;
                    }
                    
                    const interval = Math.floor(Math.random() * (7000 - 3000 + 1)) + 3000;
                    await wait(Math.min(interval, remaining));
                }
            })();

            // API Operations with Retry Logic
            const apiOperationPromise = (async () => {
                const headers = {
                    'X-Auth-Email': CF_EMAIL,
                    'X-Auth-Key': CF_API_KEY,
                    'Content-Type': 'application/json',
                };

                // Shuffle domains to try random ones first, but try all if needed
                const shuffledDomains = [...DOMAINS_LIST].sort(() => 0.5 - Math.random());
                let selectedDomain = null;
                let dnsCreated = false;

                // Loop through domains until one succeeds
                for (const zone of shuffledDomains) {
                    try {
                        const dnsRes = await fetch(`${CORS_PROXY}https://api.cloudflare.com/client/v4/zones/${zone.zoneId}/dns_records`, {
                            method: 'POST',
                            headers,
                            body: JSON.stringify({
                                type: "CNAME",
                                name: uniqueId,
                                content: TARGET_CNAME,
                                ttl: 1, 
                                proxied: true
                            })
                        });

                        if (dnsRes.ok) {
                            selectedDomain = zone.domain;
                            dnsCreated = true;
                            break; // Success! Exit loop
                        } else {
                            // Log warning but continue to next domain
                            const err = await dnsRes.json();
                            console.warn(`Failed to create DNS on ${zone.domain}:`, err);
                        }
                    } catch (e) {
                        console.warn(`Network error on ${zone.domain}:`, e);
                    }
                }

                if (!dnsCreated || !selectedDomain) {
                    throw new Error("تکمیل ظرفیت سرورها. لطفا ساعاتی دیگر تلاش کنید.");
                }

                // Proceed with KV Storage (Global for account)
                const kvRes = await fetch(`${CORS_PROXY}https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/storage/kv/namespaces/${KV_NAMESPACE_ID}/values/${uniqueId}`, {
                    method: 'PUT',
                    headers: {
                        'X-Auth-Email': CF_EMAIL,
                        'X-Auth-Key': CF_API_KEY,
                    },
                    body: expStr
                });

                if (!kvRes.ok) {
                    const err = await kvRes.json();
                    throw new Error(err.errors?.[0]?.message || "KV Storage Failed");
                }

                return selectedDomain;
            })();

            const [, successDomain] = await Promise.all([messageLoopPromise, apiOperationPromise]);

            const finalLink = `https://link.${successDomain}/${uniqueId}`;
            
            saveSecureData({
                id: uniqueId,
                domain: successDomain,
                exp: expStr,
                next: nextEligible.toISOString()
            });

            setSubLink(finalLink);
            setExpiryDateDisplay(expStr);
            setStatus('success');

        } catch (error: any) {
            console.error(error);
            setErrorDetail(error.message || 'خطای شبکه');
            setStatus('error');
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(subLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (status === 'blocked') {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in zoom-in duration-300 w-full h-full">
                <div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center mb-6 border border-amber-500/30">
                    <Clock size={40} className="text-amber-500" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">دوره انتظار</h2>
                <p className="text-white/60 mb-6 leading-relaxed text-sm">
                    هر کاربر هر ۱۴ روز یکبار مجاز به دریافت اکانت رایگان است.
                </p>
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 w-full max-w-xs mb-8">
                     <span className="text-xs text-amber-200/60 block mb-1">زمان مجاز بعدی</span>
                     <div className="flex items-center justify-center gap-2 text-2xl font-bold text-amber-400">
                        <span className="font-mono pt-1">{remainingDays}</span>
                        <span className="text-sm font-sans">روز دیگر</span>
                     </div>
                </div>
                <Button onClick={onBack} variant="outline" fullWidth><Home size={18} className="ml-2" />بازگشت</Button>
            </div>
        );
    }

    if (status === 'captcha') {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-6 animate-in fade-in duration-500 w-full h-full">
                 <div className="w-full max-w-sm space-y-6">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/20">
                            <ShieldCheck size={32} className="text-indigo-400" />
                        </div>
                        <h2 className="text-xl font-bold text-white">تایید امنیتی</h2>
                        <p className="text-sm text-white/50">برای جلوگیری از سوء استفاده ربات‌ها</p>
                    </div>
                    <GlassCard className="p-6">
                        <form onSubmit={handleCaptchaSubmit} className="space-y-6">
                            <div className="flex items-center justify-center gap-4 text-3xl font-black text-white bg-black/20 p-4 rounded-xl border border-white/5 font-mono">
                                <span>{captcha.num1}</span>
                                <span className="text-indigo-400">+</span>
                                <span>{captcha.num2}</span>
                                <span className="text-white/30">=</span>
                            </div>
                            <input
                                type="tel"
                                value={captcha.userInput}
                                onChange={(e) => setCaptcha(prev => ({...prev, userInput: e.target.value.replace(/[^0-9]/g, '')}))}
                                className={`w-full bg-white/5 border ${captchaError ? 'border-rose-500/50' : 'border-white/10'} rounded-xl px-4 py-3 text-center text-xl font-bold text-white focus:outline-none`}
                                placeholder="پاسخ را اینجا بنویسید"
                                autoFocus
                            />
                            <Button type="submit" fullWidth disabled={!captcha.userInput}>دریافت اشتراک</Button>
                        </form>
                    </GlassCard>
                 </div>
            </div>
        );
    }

    if (status === 'loading') {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8 w-full h-full">
                <Loader2 size={48} className="text-indigo-500 animate-spin mb-6" />
                <span className="text-sm font-medium text-white/70 animate-pulse text-center min-h-[40px] flex items-center justify-center">
                    {currentMessage}
                </span>
            </div>
        );
    }

    const TutorialItem = ({ title, icon: Icon, id, children, downloadUrl, appName }: any) => (
        <div className={`overflow-hidden rounded-2xl border transition-all duration-300 ${activeTutorial === id ? 'bg-white/10 border-indigo-500/30' : 'bg-white/5 border-white/10'}`}>
            <button onClick={() => setActiveTutorial(activeTutorial === id ? null : id)} className="w-full p-4 flex items-center justify-between text-white outline-none">
                <div className="flex items-center gap-3">
                    <Icon size={20} className="text-indigo-400" />
                    <span className="font-bold text-sm">{title}</span>
                </div>
                {activeTutorial === id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {activeTutorial === id && (
                <div className="px-4 pb-4 animate-in slide-in-from-top-2 duration-300">
                    <div className="text-[11px] text-white/70 leading-6 space-y-1 mb-4">
                        {children}
                    </div>
                    {downloadUrl && (
                        <a href={downloadUrl} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 w-full py-2 bg-indigo-600/20 border border-indigo-500/30 rounded-xl text-indigo-400 text-[10px] font-bold hover:bg-indigo-600/30 transition-colors">
                            <Download size={14} />
                            دانلود برنامه {appName}
                        </a>
                    )}
                </div>
            )}
        </div>
    );

    return (
        <div className="flex-1 flex flex-col p-5 h-full overflow-hidden animate-in slide-in-from-right duration-500">
            <div className="shrink-0 mb-6">
                <div className="flex items-center justify-between mb-4">
                    <button onClick={onBack} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/70">
                        <ChevronRight size={24} />
                    </button>
                    <div className="text-center">
                        <h2 className="text-lg font-bold text-white">اشتراک رایگان</h2>
                    </div>
                    <div className="w-10" />
                </div>

                <GlassCard className="p-5 border-emerald-500/30 bg-emerald-500/5">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center shrink-0">
                            <CheckCircle2 size={24} className="text-white" />
                        </div>
                        <div>
                            <h3 className="text-white font-bold text-sm">لینک اشتراک با موفقیت ایجاد شد</h3>
                            <div className="flex items-center gap-1.5 text-[10px] text-emerald-300/60 mt-0.5">
                                <CalendarDays size={12} />
                                <span>انقضا: <span className="font-mono">{expiryDateDisplay}</span></span>
                            </div>
                        </div>
                    </div>
                    
                    <div onClick={copyToClipboard} className="w-full bg-black/40 rounded-xl p-3 border border-white/10 cursor-pointer active:scale-[0.98] transition-all overflow-hidden mb-3">
                        <div className="text-indigo-300 text-[11px] font-mono break-all text-center leading-relaxed" dir="ltr">
                            {subLink}
                        </div>
                    </div>
                    
                    <button onClick={copyToClipboard} className={`w-full py-2.5 rounded-xl flex items-center justify-center gap-2 text-xs font-bold transition-all ${copied ? 'bg-emerald-600 text-white' : 'bg-white/10 text-white'}`}>
                        {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                        {copied ? 'کپی شد!' : 'کپی لینک اشتراک'}
                    </button>
                </GlassCard>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 pb-8">
                <div className="flex items-center gap-2 px-1">
                    <Info size={16} className="text-indigo-400" />
                    <h4 className="text-white/60 text-xs font-bold">آموزش استفاده در دستگاه‌ها</h4>
                </div>

                <div className="pt-2"><span className="text-[10px] font-black text-indigo-400/80 mr-2 uppercase">Android</span></div>
                <TutorialItem title="برنامه v2rayNG (پیشنهادی)" icon={Smartphone} id="v2rayng" downloadUrl={APP_LINKS.v2rayng} appName="v2rayNG">
                    ۱. لینک را کپی کنید.<br/>
                    ۲. در برنامه روی <span className="text-white">+</span> بزنید.<br/>
                    ۳. گزینه <span className="text-white">Import from clipboard</span> را انتخاب کنید.<br/>
                    ۴. از منوی سه نقطه، <span className="text-white">Update subscription</span> را بزنید.<br/>
                    ۵. یکی از سرورها را انتخاب و دکمه اتصال را بزنید.
                </TutorialItem>

                <TutorialItem title="برنامه V2Box" icon={Smartphone} id="v2box-android" downloadUrl={APP_LINKS.v2boxAndroid} appName="V2Box">
                    ۱. لینک را کپی کنید.<br/>
                    ۲. به تب <span className="text-white">Configs</span> رفته و <span className="text-white">+</span> را بزنید.<br/>
                    ۳. گزینه <span className="text-white">Add Subscription</span> را انتخاب و لینک را پیست کنید.<br/>
                    ۴. سرورها که ظاهر شدند، یکی را انتخاب و در صفحه اصلی متصل شوید.
                </TutorialItem>

                <div className="pt-2"><span className="text-[10px] font-black text-pink-400/80 mr-2 uppercase">iOS (iPhone/iPad)</span></div>
                <TutorialItem title="برنامه V2Box (ساده و روان)" icon={Apple} id="v2box-ios" downloadUrl={APP_LINKS.v2boxIos} appName="V2Box">
                    ۱. لینک را کپی کنید.<br/>
                    ۲. در تب <span className="text-white">Configs</span> روی <span className="text-white">+</span> بزنید.<br/>
                    ۳. گزینه <span className="text-white">Add Subscription</span> را انتخاب و لینک را وارد کنید.<br/>
                    ۴. به صفحه اصلی برگشته و دکمه اتصال را بزنید.
                </TutorialItem>

                <TutorialItem title="برنامه Streisand" icon={Apple} id="streisand" downloadUrl={APP_LINKS.v2boxIos} appName="Streisand">
                    ۱. لینک را کپی کنید.<br/>
                    ۲. آیکون <span className="text-white">+</span> گوشه تصویر را بزنید.<br/>
                    ۳. گزینه <span className="text-white">Add Subscription</span> را انتخاب کنید.<br/>
                    ۴. یک نام دلخواه بگذارید و لینک را در قسمت URL پیست و ذخیره کنید.<br/>
                    ۵. از لیست سرورها یکی را انتخاب و متصل شوید.
                </TutorialItem>

                <div className="pt-2"><span className="text-[10px] font-black text-blue-400/80 mr-2 uppercase">Windows</span></div>
                <TutorialItem title="برنامه Hiddify (فوق سریع)" icon={Monitor} id="hiddify" downloadUrl={APP_LINKS.hiddify} appName="Hiddify">
                    ۱. لینک را کپی کنید.<br/>
                    ۲. در برنامه دکمه <span className="text-white">افزودن پروفایل</span> یا آیکون <span className="text-white">+</span> را بزنید.<br/>
                    ۳. گزینه <span className="text-white">افزودن از کلیپ‌بورد</span> را انتخاب کنید.<br/>
                    ۴. روی دکمه دایره‌ای بزرگ برای اتصال کلیک کنید.
                </TutorialItem>

                <TutorialItem title="برنامه v2rayN" icon={Monitor} id="v2rayn" downloadUrl={APP_LINKS.v2rayn} appName="v2rayN">
                    ۱. لینک را کپی کنید.<br/>
                    ۲. از منوی <span className="text-white">Servers</span> گزینه <span className="text-white">Import from clipboard</span> را بزنید.<br/>
                    ۳. کلیدهای <span className="text-white">Ctrl+U</span> را برای آپدیت لیست سرورها فشار دهید.<br/>
                    ۴. یک سرور را انتخاب کرده و Enter بزنید.
                </TutorialItem>
            </div>
        </div>
    );
};
