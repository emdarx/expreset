

const ADMIN_ID = "1110189433";
const TELEGRAM_BOT_TOKEN = '6193623180:AAH5ec6GGMeSkEzqs_9I7R3Qs28HBCBlOF8';
const GEMINI_API_KEY = "AIzaSyDE2YOvRsKyH9XIKq183L8sOTKv4Yla7BE"; 
const NOWPAYMENTS_API_KEY = "AHH8TYQ-ZKE4K4Q-HR0B5A8-MGN22VA";
const KV_NAMESPACE_ID = '6eda059eed2c4454a35aadee9c167319';
const CF_ACCOUNT_ID = 'b0afdfd4b33d9e520bd966a3e434abe6';
const CF_EMAIL = 'amdark77@gmail.com';
const CF_API_KEY = '990859427ef7a7dc0d1ce988126d2abdffd53';
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

const DOMAINS_LIST = [
    { domain: "aptic.ir", zoneId: "26d0b00a76a66f702014eef0881b751d" },
    { domain: "smident.ir", zoneId: "e8e97daec2ff9f9ed2f1321690cf773f" },
    { domain: "goshime.ir", zoneId: "4fe611219e2ee6065929eae3927ef60b" },
    { domain: "mitsonic.ir", zoneId: "a88f3fa7f4946a5e8f32b524223a7fcb" },
];    
    
const V2RAY = {
    plan_1m2u: { label: 'ویتوری 1 ماهه 2 کاربر', price: 149000, days: 30 },
    plan_3m3u: { label: 'ویتوری 3 ماهه 3 کاربر', price: 349000, days: 90 },
    plan_6m4u: { label: 'ویتوری 6 ماهه 6 کاربر', price: 499000, days: 180 },
    plan_12m6u: { label: 'ویتوری 12 ماهه 6 کاربر', price: 999000, days: 365 }
};
  
const EXPRESS = {
    explan_1m1u: { label: 'اکسپرس 1 ماهه 1 کاربر', price: 199000, days: 30 },
    explan_3m1u: { label: 'اکسپرس 3 ماهه 1 کاربر', price: 399000, days: 90 },
    explan_12m1u: { label: 'اکسپرس 12 ماهه 1 کاربر', price: 999000, days: 365 },
};  

const allPlans = { ...V2RAY, ...EXPRESS };
const userCache = new Map();
const settingsCache = {};

// Cloudflare Pages Function Entry Point
export async function onRequest(context) {
    const { request, env } = context;
    return handleRequest(request, env);
}

function escapeMarkdown(text) {
    if (!text) return '';
    return text.toString().replace(/([_*[\]()~`>#+-.!{}|\\=])/g, '\\$1');
}

async function telegramApiCall(method, payload) {
    try {
        const response = await fetch(`${TELEGRAM_API}/${method}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        if (!response.ok) {
            console.error(`Telegram API error (${method}): ${data.description}`);
        }
        return data;
    } catch (error) {
        console.error(`Error in telegramApiCall (${method}): ${error.message}`);
        throw error;
    }
}

async function validateChatId(chatId) {
    try {
        await telegramApiCall('getChat', { chat_id: chatId });
        return true;
    } catch (error) {
        console.error(`Error validating chat_id ${chatId}: ${error.message}`);
        return false;
    }
}

async function initTables(env) {
    try {
        await env.DB.exec('CREATE TABLE IF NOT EXISTS users (user_id INTEGER PRIMARY KEY, last_selected_plan TEXT, user_settings TEXT)');
        await env.DB.exec('CREATE TABLE IF NOT EXISTS cards (id INTEGER PRIMARY KEY AUTOINCREMENT, card_number TEXT, owner_name TEXT)');
        
        try {
            await env.DB.exec('ALTER TABLE users ADD COLUMN user_settings TEXT');
        } catch (e) {
        }
    } catch (error) {
        console.error(`Error initializing tables: ${error.message}`);
    }
}

async function checkOrAddUser(env, userId) {
    if (userCache.has(userId)) return;
    try {
        const stmt = env.DB.prepare("SELECT 1 FROM users WHERE user_id = ?").bind(userId);
        const result = await stmt.first();
        if (!result) {
            await env.DB.prepare("INSERT INTO users (user_id, user_settings) VALUES (?, ?)").bind(userId, '{}').run();
        }
        userCache.set(userId, {});
    } catch (error) {
        console.error(`Error with D1 for user ${userId}: ${error.message}`);
    }
}

async function getUserCount(env) {
    try {
        const stmt = env.DB.prepare("SELECT COUNT(*) as count FROM users");
        const result = await stmt.first();
        return result ? result.count : 0;
    } catch (error) {
        console.error(`Error counting users: ${error.message}`);
        return 0;
    }
}

async function getUserSettingsD1(env, userId) {
    try {
        const stmt = env.DB.prepare("SELECT user_settings, last_selected_plan FROM users WHERE user_id = ?").bind(userId);
        const result = await stmt.first();
        
        if (result && result.user_settings) {
            return JSON.parse(result.user_settings);
        } else if (result && result.last_selected_plan) {
            return { last_selected_plan: result.last_selected_plan };
        }
        return {};
    } catch (error) {
        console.error(`Error getting settings for ${userId}: ${error.message}`);
        return {};
    }
}

async function updateUserSettingsD1(env, userId, newSettings) {
    try {
        const currentSettings = await getUserSettingsD1(env, userId);
        const updated = { ...currentSettings, ...newSettings };
        await env.DB.prepare("UPDATE users SET user_settings = ? WHERE user_id = ?").bind(JSON.stringify(updated), userId).run();
    } catch (error) {
        console.error(`Error updating settings for ${userId}: ${error.message}`);
    }
}

async function getAllCards(env) {
    try {
        const { results } = await env.DB.prepare("SELECT * FROM cards").all();
        return results || [];
    } catch (error) {
        console.error(`Error fetching cards: ${error.message}`);
        return [];
    }
}

async function addCard(env, number, owner) {
    try {
        await env.DB.prepare("INSERT INTO cards (card_number, owner_name) VALUES (?, ?)").bind(number, owner).run();
        return true;
    } catch (error) {
        console.error(`Error adding card: ${error.message}`);
        return false;
    }
}

async function deleteCard(env, id) {
    try {
        await env.DB.prepare("DELETE FROM cards WHERE id = ?").bind(id).run();
        return true;
    } catch (error) {
        console.error(`Error deleting card: ${error.message}`);
        return false;
    }
}

async function updateUserLastPlan(env, userId, planKey) {
    await updateUserSettingsD1(env, userId, { last_selected_plan: planKey });
}

async function getUserLastPlan(env, userId) {
    const settings = await getUserSettingsD1(env, userId);
    return settings.last_selected_plan || null;
}

async function initSettings(env) {
    try {
        await env.DB.exec('CREATE TABLE IF NOT EXISTS settings (id INTEGER PRIMARY KEY, data TEXT)');
        const stmt = env.DB.prepare("SELECT * FROM settings WHERE id = 1");
        const result = await stmt.first();
        if (!result) {
            const initialSettings = {
                status: true,
                free_test_status: true,
                discount: { code: '', percent: 0 },
                agent_discount: { code: 'RTD', percent: 5 },
                channel_lock: { status: false, channel_id: '' }
            };
            await env.DB.prepare("INSERT INTO settings (id, data) VALUES (1, ?)").bind(JSON.stringify(initialSettings)).run();
            settingsCache.data = initialSettings;
        } else {
            const settings = JSON.parse(result.data);
            settings.discount = settings.discount || { code: '', percent: 0 };
            settings.agent_discount = settings.agent_discount || { code: 'RTD', percent: 5 };
            if (typeof settings.free_test_status === 'undefined') settings.free_test_status = true;
            if (!settings.channel_lock) settings.channel_lock = { status: false, channel_id: '' };
            settingsCache.data = settings;
        }
    } catch (error) {
        console.error(`Error initializing settings: ${error.message}`);
    }
}

async function updateSettings(env, newSettings) {
    settingsCache.data = newSettings;
    try {
        await env.DB.prepare("UPDATE settings SET data = ? WHERE id = 1").bind(JSON.stringify(newSettings)).run();
    } catch (error) {
        console.error(`Error updating settings: ${error.message}`);
    }
}

async function getSettings() {
    return settingsCache.data || {
        status: true,
        free_test_status: true,
        discount: { code: '', percent: 0 },
        agent_discount: { code: 'RTD', percent: 5 },
        channel_lock: { status: false, channel_id: '' }
    };
}

async function checkUserMembership(userId, channelId) {
    try {
        const response = await telegramApiCall('getChatMember', { chat_id: channelId, user_id: userId });
        if (response.ok && response.result) {
            const status = response.result.status;
            return ['creator', 'administrator', 'member'].includes(status);
        }
        return false;
    } catch (error) {
        console.error('Error checking membership:', error);
        return false;
    }
}

async function showForceJoinMessage(chatId, channelId) {
    const channelLink = channelId.startsWith('@') ? `https://t.me/${channelId.substring(1)}` : `https://t.me/${channelId}`;
    const text = `⚠️ *پیش از شروع کار با ربات، داخل کانال اکسپرس عضو بشید\\.*
    
🔍 _با عضویت داخل‌ کانال از اطلاعیه ها، اخبار‌ وضعیت اینترنت، تخفیف ها، آموزش ها و… جا نمیمونی\\!_`;
    
    const inlineKeyboard = [
        [{ text: '📢 عضویت در کانال', url: channelLink }],
        [{ text: '✅ عضو شدم', callback_data: 'verify_join' }]
    ];
    
    await sendMessage(chatId, text, inlineKeyboard, false);
}

async function getTrxPrice() {
    try {
        const response = await fetch('https://api.wallex.ir/v1/markets');
        if (response.ok) {
            const data = await response.json();
            if (data.result && data.result.symbols && data.result.symbols.TRXTMN) {
                return parseFloat(data.result.symbols.TRXTMN.stats.lastPrice);
            }
        }
    } catch (error) {
        console.error('Wallex API failed:', error);
    }
    return null;
}

async function createNowPayment(amountTrx) {
    try {
        const response = await fetch('https://api.nowpayments.io/v1/payment', {
            method: 'POST',
            headers: {
                'x-api-key': NOWPAYMENTS_API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                price_amount: amountTrx,
                price_currency: 'trx',
                pay_currency: 'trx',
            })
        });
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error creating payment:', error);
        return null;
    }
}

async function checkPaymentStatus(paymentId) {
    try {
        const response = await fetch(`https://api.nowpayments.io/v1/payment/${paymentId}`, {
            method: 'GET',
            headers: {
                'x-api-key': NOWPAYMENTS_API_KEY
            }
        });
        const data = await response.json();
        return data.payment_status;
    } catch (error) {
        console.error('Error checking payment status:', error);
        return null;
    }
}

async function handleRequest(request, env) {
    if (request.method !== 'POST') {
        return new Response('OK', { status: 200 });
    }

    try {
        await initTables(env);
        await initSettings(env);
        const botSettings = await getSettings();
        const data = await request.json();

        let chatId, userId, msgId, callbackData, isPhoto = false;

        if (data.message) {
            chatId = data.message.chat.id;
            userId = data.message.from.id;
            msgId = data.message.message_id;
        } else if (data.callback_query) {
            chatId = data.callback_query.message.chat.id;
            userId = data.callback_query.from.id;
            msgId = data.callback_query.message.message_id;
            callbackData = data.callback_query.data;
            isPhoto = !!data.callback_query.message.photo;
        } else {
            return new Response('OK', { status: 200 });
        }

        if (!(await validateChatId(chatId))) {
            return new Response('OK', { status: 200 });
        }
        await checkOrAddUser(env, userId);

        let userData = userCache.get(userId) || {};

        if (!botSettings.status && userId.toString() !== ADMIN_ID) {
            if (callbackData === 'check_status') {
                 await answerCallbackQuery(data.callback_query.id, '🚧 هنوز در حال بروزرسانی هستیم...\nلطفاً دقایقی دیگر مجدداً تلاش کنید 🌹', true);
                 return new Response('OK', { status: 200 });
            }

            const maintenanceText = `📣 *اطلاعیه مهم: بروزرسانی سرورها*

با توجه به استقبال گسترده شما عزیزان ❤️ و افزایش ظرفیت سرورها 🚀
برای حفظ و ارتقای کیفیت، فروش را به مدت کوتاهی می‌بندیم 🛠

⏳ *به‌زودی و خیلی سریع برمی‌گردیم\\!*

شما می‌توانید در ساعات آینده مجدداً ربات را بررسی کنید 🌹`;

            const maintenanceKeyboard = [[{ text: '🔄 بررسی وضعیت', callback_data: 'check_status' }]];

            if (data.callback_query) {
                await answerCallbackQuery(data.callback_query.id, '⛔️ ربات در حال بروزرسانی است', true);
                await sendMessage(chatId, maintenanceText, maintenanceKeyboard, false);
            } else {
                await sendMessage(chatId, maintenanceText, maintenanceKeyboard, false);
            }
            return new Response('OK', { status: 200 });
        }

        if (userId.toString() !== ADMIN_ID && callbackData !== 'verify_join' && !callbackData?.startsWith('admin_') && !callbackData?.startsWith('manage_') && !callbackData?.startsWith('set_') && !callbackData?.startsWith('toggle_')) {
            if (botSettings.channel_lock && botSettings.channel_lock.status && botSettings.channel_lock.channel_id) {
                const isMember = await checkUserMembership(userId, botSettings.channel_lock.channel_id);
                if (!isMember) {
                    if (data.callback_query) {
                         await answerCallbackQuery(data.callback_query.id, '⚠️ لطفاً ابتدا در کانال عضو شوید.', true);
                    }
                    await showForceJoinMessage(chatId, botSettings.channel_lock.channel_id);
                    return new Response('OK', { status: 200 });
                }
            }
        }

        if (data.message && data.message.photo) {
            if (userId.toString() === ADMIN_ID && userData.state === 'creating_ad') {
                 return await handleAdCreationInput(data, chatId, userId, env);
            }
            return await handlePhotoReceipt(data, userId, env);
        }

        if (data.message && await isInSupport(userId)) {
            if (data.message.text) {
                const userText = data.message.text;
                
                await telegramApiCall('sendChatAction', { chat_id: chatId, action: 'typing' });

                const userSettings = await getUserSettingsD1(env, userId);
                const lastUserMessage = userSettings.last_user_message || '';

                const { aiResponse } = await getAiResponse(userText, lastUserMessage);
                await sendMessage(chatId, aiResponse, [[{ text: '❌ بستن گفتگو', callback_data: 'close_support' }]], true);

                await updateUserSettingsD1(env, userId, { last_user_message: userText });
            }
            return new Response('OK', { status: 200 });
        }

        if (callbackData) {
            return await handleCallbackQuery(callbackData, chatId, userId, msgId, data, env, isPhoto);
        }

        if (data.message && data.message.text) {
            return await handleTextMessage(data, chatId, userId, msgId, botSettings, env);
        }

    } catch (error) {
        console.error(`Top-level handleRequest error: ${error.message}`);
    }
    return new Response('OK', { status: 200 });
}

async function handleTextMessage(data, chatId, userId, msgId, botSettings, env) {
    const text = data.message.text.trim();
    let userData = userCache.get(userId) || {};

    if (text === '/start') {
        await showMainMenu(chatId, userId, env);
    } else if (text === '/buy') {
        await showBuyMenu(chatId, userId, botSettings);
    } else if (text === '/support') {
        await setSupport(userId, true);
        await sendMessage(chatId, '🧠 *سوالتو بپرس عزیزم، پشتیبانی خیلی سریع جواب میده* 🌸', [[{ text: '❌ بستن گفتگو', callback_data: 'close_support' }]], false);
    } else if (userData.state === 'creating_ad' && userId.toString() === ADMIN_ID) {
        await handleAdCreationInput(data, chatId, userId, env);
    } else if (userData.state?.startsWith('setting_') || userData.state === 'adding_card') {
        await handleAdminSettingsInput(text, chatId, userId, env);
    } else if (userData.state === 'entering_discount_code') {
        await handleDiscountCodeInput(text, chatId, userId, env);
    } else {
        await deleteMessage(chatId, msgId);
        await showMainMenu(chatId, userId, env);
    }
    return new Response('OK', { status: 200 });
}

async function handleCallbackQuery(callbackData, chatId, userId, msgId, data, env, isPhoto) {
    let userData = userCache.get(userId) || {};
    const botSettings = await getSettings();

    if (callbackData === 'check_status') {
        await deleteMessage(chatId, msgId);
        await answerCallbackQuery(data.callback_query.id, '✅ ربات آنلاین شد!');
        await showMainMenu(chatId, userId, env);
        return new Response('OK', { status: 200 });
    }

    if (callbackData === 'verify_join') {
        if (botSettings.channel_lock && botSettings.channel_lock.status && botSettings.channel_lock.channel_id) {
            const isMember = await checkUserMembership(userId, botSettings.channel_lock.channel_id);
            if (isMember) {
                await deleteMessage(chatId, msgId);
                await sendMessage(chatId, '✅ *عضویت شما تایید شد\\. خوش آمدید\\!*', null, false);
                await showMainMenu(chatId, userId, env);
            } else {
                await answerCallbackQuery(data.callback_query.id, '❌ شما هنوز در کانال عضو نشده‌اید.', true);
            }
        } else {
            await deleteMessage(chatId, msgId);
            await showMainMenu(chatId, userId, env);
        }
        return new Response('OK', { status: 200 });
    }

    if (callbackData.startsWith('confirm_user_') || callbackData.startsWith('reject_init_') || callbackData.startsWith('reject_do_') || callbackData.startsWith('reject_back_')) {
        return await handleAdminAction(callbackData, msgId, data, env);
    }

    if (callbackData.startsWith('delete_card_')) {
        const cardId = callbackData.split('_')[2];
        await deleteCard(env, cardId);
        await showCardManagementMenu(chatId, userId, env, msgId, isPhoto);
        await answerCallbackQuery(data.callback_query.id, '✅ کارت حذف شد');
        return new Response('OK', { status: 200 });
    }

    if (callbackData === 'check_payment') {
        if (!userData.pendingPayment || !userData.pendingPayment.payment_id) {
            await answerCallbackQuery(data.callback_query.id, '⚠️ هیچ پرداخت فعالی یافت نشد.', true);
            return new Response('OK', { status: 200 });
        }

        const status = await checkPaymentStatus(userData.pendingPayment.payment_id);
        if (status === 'finished' || status === 'sending' || status === 'confirmed') {
            await answerCallbackQuery(data.callback_query.id, '✅ پرداخت تایید شد! اشتراک شما در حال صدور است...', true);
            await deleteMessage(chatId, msgId);
            await processCardToCardSubscription(chatId, userData.pendingPayment.plan, env); 
            userData.pendingPayment = null; 
            userCache.set(userId, userData);
            return new Response('OK', { status: 200 });
        } else {
             await answerCallbackQuery(data.callback_query.id, '❌ پرداخت شما هنوز دریافت نشده است.\n\nلطفاً پس از ارسال ارز، حدود ۱ تا ۵ دقیقه صبر کنید تا شبکه تراکنش را تایید کند، سپس مجدداً روی دکمه کلیک کنید.', true);
        }
        return new Response('OK', { status: 200 });
    }

    const Actions = {
        'buy': async () => await showBuyMenu(chatId, userId, botSettings, msgId, isPhoto),
        'back_main': async () => { await showMainMenu(chatId, userId, env, msgId, isPhoto); },
        'support_loop': async () => { await deleteMessage(chatId, msgId); await setSupport(userId, true); await sendMessage(chatId, '🧠 *سوالتو بپرس عزیزم، پشتیبانی خیلی سریع جواب میده* 🌸', [[{ text: '❌ بستن گفتگو', callback_data: 'close_support' }]], false); },
        'support_keep_msg': async () => { await setSupport(userId, true); await sendMessage(chatId, '🧠 *سوالتو بپرس عزیزم، پشتیبانی خیلی سریع جواب میده* 🌸', [[{ text: '❌ بستن گفتگو', callback_data: 'close_support' }]], false); },
        'close_support': async () => { await deleteMessage(chatId, msgId); await setSupport(userId, false); await showMainMenu(chatId, userId, env); },
        'admin_menu': async () => { await showAdminMenu(chatId, userId, env, msgId, isPhoto); },
        'manage_discounts': async () => { await showDiscountMenu(chatId, userId, env, msgId, isPhoto); },
        'v2ray_plan': async () => { await showV2rayPlans(chatId, userId, env, msgId, isPhoto); },
        'express_plan': async () => { await showExpressPlans(chatId, msgId, isPhoto); },
        'enter_discount_code': async () => { userData.state = 'entering_discount_code'; userCache.set(userId, userData); await sendOrEditMessage(chatId, msgId, isPhoto, '🎫 *لطفاً کد تخفیف خود را وارد کنید:*', [[{ text: '↩️ بازگشت', callback_data: 'back_main' }]]); },
        'set_discount': async () => { userData.state = 'setting_discount_code'; userCache.set(userId, userData); await sendMessage(chatId, 'لطفاً کد تخفیف جدید کاربران را وارد کنید:', null, true); },
        'set_agent_discount': async () => { userData.state = 'setting_agent_discount_code'; userCache.set(userId, userData); await sendMessage(chatId, 'لطفاً کد تخفیف جدید نمایندگان را وارد کنید:', null, true); },
        'toggle_status': async () => { botSettings.status = !botSettings.status; await updateSettings(env, botSettings); await answerCallbackQuery(data.callback_query.id, botSettings.status ? '✅ ربات روشن شد' : '❌ ربات خاموش شد'); await showAdminMenu(chatId, userId, env, msgId, isPhoto); },
        'toggle_freetest': async () => { botSettings.free_test_status = !botSettings.free_test_status; await updateSettings(env, botSettings); await answerCallbackQuery(data.callback_query.id, botSettings.free_test_status ? '✅ تست رایگان فعال شد' : '❌ تست رایگان غیرفعال شد'); await showAdminMenu(chatId, userId, env, msgId, isPhoto); },
        'manage_cards': async () => { await showCardManagementMenu(chatId, userId, env, msgId, isPhoto); },
        'add_card': async () => { userData.state = 'adding_card'; userCache.set(userId, userData); await sendOrEditMessage(chatId, msgId, isPhoto, 'لطفاً شماره کارت و نام صاحب کارت را با یک خط فاصله وارد کنید:\nمثال:\n`6037991234567890 - علی احمدی`', [[{ text: '↩️ بازگشت', callback_data: 'manage_cards' }]]); },
        'delete_discount_user': async () => { botSettings.discount = { code: '', percent: 0 }; await updateSettings(env, botSettings); await answerCallbackQuery(data.callback_query.id, '✅ کد تخفیف کاربران حذف شد'); await showDiscountMenu(chatId, userId, env, msgId, isPhoto); },
        'delete_discount_agent': async () => { botSettings.agent_discount = { code: '', percent: 0 }; await updateSettings(env, botSettings); await answerCallbackQuery(data.callback_query.id, '✅ کد تخفیف نمایندگان حذف شد'); await showDiscountMenu(chatId, userId, env, msgId, isPhoto); },
        'manage_channel_lock': async () => { await showChannelLockMenu(chatId, userId, env, msgId, isPhoto); },
        'toggle_channel_lock': async () => { 
            if(!botSettings.channel_lock.channel_id){
                 await answerCallbackQuery(data.callback_query.id, '⚠️ ابتدا یک کانال تنظیم کنید!', true);
                 return;
            }
            botSettings.channel_lock.status = !botSettings.channel_lock.status; 
            await updateSettings(env, botSettings); 
            await answerCallbackQuery(data.callback_query.id, botSettings.channel_lock.status ? '✅ قفل کانال فعال شد' : '❌ قفل کانال غیرفعال شد'); 
            await showChannelLockMenu(chatId, userId, env, msgId, isPhoto); 
        },
        'set_channel_id': async () => { userData.state = 'setting_channel_id'; userCache.set(userId, userData); await sendOrEditMessage(chatId, msgId, isPhoto, 'لطفاً آیدی کانال را وارد کنید (مثال: @MyChannel):', [[{text: '↩️ بازگشت', callback_data: 'manage_channel_lock'}]]); },
        'remove_channel_id': async () => { botSettings.channel_lock = { status: false, channel_id: '' }; await updateSettings(env, botSettings); await answerCallbackQuery(data.callback_query.id, '✅ کانال حذف و قفل غیرفعال شد'); await showChannelLockMenu(chatId, userId, env, msgId, isPhoto); },
        'target_ads_menu': async () => { await showTargetedAdsMenu(chatId, userId, env, msgId, isPhoto); },
        'create_ad_ai': async () => { await generateAiAd(chatId, userId, env, msgId); },
        'create_ad_manual': async () => { userData.state = 'creating_ad'; userCache.set(userId, userData); await sendOrEditMessage(chatId, msgId, isPhoto, escapeMarkdown('✍️ لطفاً متن تبلیغاتی خود را ارسال کنید (یا یک عکس به همراه کپشن بفرستید):'), [[{ text: '↩️ بازگشت', callback_data: 'target_ads_menu' }]]); },
        'confirm_send_ads': async () => { await broadcastAd(chatId, userId, env, msgId); },
        'cancel_ads': async () => { userData.draftAd = null; userData.state = null; userCache.set(userId, userData); await answerCallbackQuery(data.callback_query.id, '❌ ارسال لغو شد'); await showTargetedAdsMenu(chatId, userId, env, msgId, isPhoto); }
    };

    if (Actions[callbackData]) {
        await answerCallbackQuery(data.callback_query.id);
        await Actions[callbackData]();
    } else if (allPlans[callbackData]) {
        await answerCallbackQuery(data.callback_query.id);
        userData.selectedPlan = callbackData;
        await updateUserLastPlan(env, userId, callbackData);
        userData.paymentAmount = allPlans[callbackData].price;
        delete userData.appliedDiscount;
        userCache.set(userId, userData);
        await showPaymentOptions(chatId, userId, callbackData, msgId, isPhoto);
    } else if (callbackData.startsWith('card|')) {
        await answerCallbackQuery(data.callback_query.id);
        const [, planKey] = callbackData.split('|');
        await handleCardPayment(chatId, userId, planKey, env, msgId, isPhoto);
    } else if (callbackData.startsWith('crypto|')) {
        await answerCallbackQuery(data.callback_query.id);
        const [, planKey] = callbackData.split('|');
        await handleCryptoPayment(chatId, userId, planKey, msgId);
    } else {
        await answerCallbackQuery(data.callback_query.id);
        await showMainMenu(chatId, userId, env, msgId, isPhoto);
    }

    return new Response('OK', { status: 200 });
}


async function processCardToCardSubscription(chatId, planKey, env) {
    const userData = userCache.get(chatId) || {};
    const plan = allPlans[planKey] || V2RAY.plan_1m2u;
    const now = new Date();
    const expiry = new Date(now);
    expiry.setDate(expiry.getDate() + plan.days);
    const formattedExpiry = expiry.toISOString().slice(0, 10);
    const randomKey = generateRandomString(12);

    // Shuffle domains for retry logic
    const shuffledDomains = [...DOMAINS_LIST].sort(() => 0.5 - Math.random());
    let selectedConfig = null;
    let dnsCreated = false;

    // Loop through domains until DNS creation succeeds
    for (const domainConfig of shuffledDomains) {
        try {
            await createDNSRecord(randomKey, domainConfig.zoneId);
            selectedConfig = domainConfig;
            dnsCreated = true;
            break; // Exit loop on success
        } catch (e) {
            console.error(`DNS creation failed for ${domainConfig.domain}:`, e);
            // Continue to the next domain
        }
    }

    if (!dnsCreated || !selectedConfig) {
        await sendMessage(chatId, '⚠️ خطا در ایجاد اشتراک. لطفا با پشتیبانی تماس بگیرید.', null, false);
        return null;
    }

    const currentDomain = selectedConfig.domain;
    
    await putKV(randomKey, formattedExpiry);
    
    const link = `https://link.${currentDomain}/${randomKey}`;

    const cloudName = 'daa1r5fxg';
    const backgroundImageUrl = 'https://i.ibb.co/fJ7nmz8/qr.jpg';
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(link)}&size=500x500&qzone=1&format=png`;
    
    const encodedQrUrl = btoa(qrCodeUrl).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');

    const finalImageUrl = `https://res.cloudinary.com/${cloudName}/image/fetch/c_fill,h_1000,w_1000/l_fetch:${encodedQrUrl},w_450,g_center/${backgroundImageUrl}`;

    const caption = `✅ *اشتراک شما ایجاد شد*

🛍 سرویس: ${escapeMarkdown(plan.label)}
📡 حجم: *نامحدود*
⏳ تاریخ انقضا: ${escapeMarkdown(formattedExpiry.split('-').reverse().join('-'))}

🔗 *لینک اشتراک شما:*
\`${escapeMarkdown(link)}\`

👆🏻 *برای کپی کردن لینک بالا فقط کافیست آدرس لینک را یک بار لمس کنید\\!*`;

    const inlineKeyboard = [
        [{ text: '🌐 مشاهده اشتراک در سایت', url: link }],
        [
            { text: '📌 راهنمای اتصال', url: 'https://t.me/ExpresetHelp/18' },
            { text: '👤 پشتیبانی آنلاین', callback_data: 'support_keep_msg' }
        ]
    ];

    if (planKey.startsWith('explan_')) {
        const expressNotification = `🎯 *اطلاعیه مهم برای کاربران سرویس ExpressVPN* 🎯

با توجه به شرایط فعلی اینترنت و اختلال‌های زیرساختی در اتصال مستقیم به سرورهای رسمی ExpressVPN، در حال حاضر امکان ارائه مستقیم ایمیل و پسورد این سرویس وجود ندارد\\.

اما برای اینکه تجربه‌ی شما دچار افت کیفیت نشود، تیم ما با استفاده از سیستم‌های اختصاصی، *۱۰ لوکیشن برتر ExpressVPN* را از سرورهای رسمی و زیرمجموعه‌ی ISP اصلی شرکت ExpressVPN استخراج و در قالب کانفیگ‌های اختصاصی V2Ray \\(وی‌توری\\) در اختیارتان قرار داده است\\.⚡

✅ این سرورها دقیقاً از همان دیتاسنترها و آی‌پی‌هایی هستند که توسط خود ExpressVPN استفاده می‌شوند،
و شما می‌توانید پس از اتصال، موقعیت و منبع سرور را به‌صورت کاملاً شفاف بررسی و تأیید کنید 🌍

💡 این تغییر فقط برای حفظ پایداری، سرعت و امنیت اتصال شما انجام شده است\\.
در واقع کیفیت و سرعت سرویس جدید نه‌تنها کمتر از ExpressVPN نیست، بلکه در شرایط فعلی اینترنت ایران عملکردی بهتر و پایدارتر ارائه می‌دهد\\.

🔁 به‌محض رفع مشکلات و بازگشت پایداری در سرورهای اصلی، گزینه‌ی فعال‌سازی مستقیم ExpressVPN دوباره از طریق ربات برای شما فعال خواهد شد`;
        await sendMessage(chatId, expressNotification, null, false);
    }

    await sendPhoto(chatId, finalImageUrl, caption, inlineKeyboard);
    
    return { randomKey, domain: currentDomain };
}

async function handleAdminAction(callbackData, msgId, data, env) {
    const adminChat = data.callback_query.message.chat.id;
    const cb = data.callback_query;

    const confirmMatch = callbackData.match(/^confirm_user_(\d+)_plan_(.+)$/);
    if (confirmMatch) {
        const userId = Number(confirmMatch[1]);
        const planKey = confirmMatch[2];
        const plan = allPlans[planKey] || V2RAY.plan_1m2u;
        
        const result = await processCardToCardSubscription(userId, planKey, env);
        
        if (result) {
            const randomKey = result.randomKey;
            const domain = result.domain;
            
            const confirmedKeyboard = [[{ text: '✅ سفارش تایید شد', callback_data: 'noop' }]];
            await telegramApiCall('editMessageReplyMarkup', { 
                chat_id: adminChat, 
                message_id: msgId, 
                reply_markup: { inline_keyboard: confirmedKeyboard } 
            });

            await sendReceiptToAdmin(userId, 'کارت به کارت', plan.label, plan.price, randomKey, domain);

            await answerCallbackQuery(cb.id, '✅ اشتراک فعال و رسید ارسال شد.');
        } else {
             await answerCallbackQuery(cb.id, '❌ خطا در صدور اشتراک', true);
        }
        return new Response('OK', { status: 200 });
    }

    const rejectInitMatch = callbackData.match(/^reject_init_(\d+)_plan_(.+)$/);
    if (rejectInitMatch) {
        const userId = rejectInitMatch[1];
        const planKey = rejectInitMatch[2];
        
        const reasonsKeyboard = [
            [{ text: "🚫 فیش واریز تقلبی", callback_data: `reject_do_${userId}_fake` }],
            [{ text: "💰 عدم واریز صحیح مبلغ", callback_data: `reject_do_${userId}_amount` }],
            [{ text: "⚠️ سایر موارد", callback_data: `reject_do_${userId}_other` }],
            [{ text: "↩️ بازگشت", callback_data: `reject_back_${userId}_plan_${planKey}` }]
        ];

        await telegramApiCall('editMessageReplyMarkup', { 
            chat_id: adminChat, 
            message_id: msgId, 
            reply_markup: { inline_keyboard: reasonsKeyboard } 
        });
        await answerCallbackQuery(cb.id);
        return new Response('OK', { status: 200 });
    }

    const rejectBackMatch = callbackData.match(/^reject_back_(\d+)_plan_(.+)$/);
    if (rejectBackMatch) {
        const userId = rejectBackMatch[1];
        const planKey = rejectBackMatch[2];
        
        const originalKeyboard = [
            [{ text: "❌ رد پرداخت", callback_data: `reject_init_${userId}_plan_${planKey}` },
             { text: "✅ تایید پرداخت", callback_data: `confirm_user_${userId}_plan_${planKey}` }]
        ];

        await telegramApiCall('editMessageReplyMarkup', { 
            chat_id: adminChat, 
            message_id: msgId, 
            reply_markup: { inline_keyboard: originalKeyboard } 
        });
        await answerCallbackQuery(cb.id);
        return new Response('OK', { status: 200 });
    }

    const rejectDoMatch = callbackData.match(/^reject_do_(\d+)_(.+)$/);
    if (rejectDoMatch) {
        const userId = Number(rejectDoMatch[1]);
        const reasonKey = rejectDoMatch[2];
        
        const reasonTexts = {
            'fake': 'فیش واریز تقلبی',
            'amount': 'عدم واریز صحیح مبلغ',
            'other': 'سایر موارد'
        };
        const reasonText = reasonTexts[reasonKey] || 'دلایل امنیتی';

        const userMsg = `❌ *متاسفانه پرداخت شما تایید نشد* 😔

👤 کاربر گرامی،
بررسی‌های ما نشان می‌دهد که سفارش شما به دلیل زیر رد شده است:

⚠️ *دلیل:* ${escapeMarkdown(reasonText)}

📞 اگر اطمینان دارید که اشتباهی رخ داده است، لطفاً با پشتیبانی تماس بگیرید تا مجدداً بررسی شود\\.
🆔 @ExpresetSupport`;

        await sendMessage(userId, userMsg, null, false);

        const resultKeyboard = [
            [{ text: `❌ رد شد: ${reasonText}`, callback_data: 'noop' }] 
        ];

        await telegramApiCall('editMessageReplyMarkup', { 
            chat_id: adminChat, 
            message_id: msgId, 
            reply_markup: { inline_keyboard: resultKeyboard } 
        });

        await answerCallbackQuery(cb.id, `❌ سفارش به دلیل ${reasonText} رد شد.`);
        return new Response('OK', { status: 200 });
    }

    return new Response('OK', { status: 200 });
}

async function handlePhotoReceipt(data, userId, env) {
    const chatId = data.message.chat.id;
    const largestPhoto = data.message.photo.pop();
    const photoFileId = largestPhoto.file_id;
    const username = escapeMarkdown(data.message.from.username || 'نامشخص');
    const firstName = escapeMarkdown(data.message.from.first_name || 'نامشخص');

    let userData = userCache.get(userId) || {};
    const d1Settings = await getUserSettingsD1(env, userId);
    let planKey = userData.selectedPlan || d1Settings.last_selected_plan || 'plan_1m2u';
    let plan = allPlans[planKey] || V2RAY.plan_1m2u;

    const captionText = `🧾 *رسید پرداخت جدید \\(کارت به کارت\\)*

👤 آیدی کاربر: \`${chatId}\`
👤 یوزرنیم: @${username}
👤 نام: ${firstName}
📦 نام محصول: ${escapeMarkdown(plan.label)}
💳 قیمت محصول: *${escapeMarkdown((userData.paymentAmount || plan.price).toLocaleString('en-US'))}* تومان

آیا این پرداخت تایید می‌شود؟`;

    await telegramApiCall('sendPhoto', {
        chat_id: ADMIN_ID,
        photo: photoFileId,
        caption: captionText,
        parse_mode: 'MarkdownV2',
        reply_markup: {
            inline_keyboard: [
                [{ text: "❌ رد پرداخت", callback_data: `reject_init_${chatId}_plan_${planKey}` },
                 { text: "✅ تایید پرداخت", callback_data: `confirm_user_${chatId}_plan_${planKey}` }]
            ]
        }
    });
    
    await showMainMenu(chatId, userId, env);
    await sendMessage(chatId, '🎉 *رسیدت رسید\\!* بعد از تایید نهایی، سفارشت سریع برات فرستاده می‌شه ✨', null, false);
    return new Response('OK', { status: 200 });
}

async function handleDiscountCodeInput(text, chatId, userId, env) {
    const userData = userCache.get(userId) || {};
    if (!userData.selectedPlan) {
        await sendMessage(chatId, '⚠️ خطا: لطفاً ابتدا یک پلن را انتخاب کنید.');
        await showMainMenu(chatId, userId, env);
        return;
    }

    const { discount, agent_discount } = await getSettings();
    let validCodeFound = false;

    if (text === discount.code && discount.percent > 0) {
        userData.appliedDiscount = discount.percent;
        await sendMessage(chatId, `✅ کد تخفیف شما با موفقیت اعمال شد! شما ${discount.percent}% تخفیف دریافت کرده‌اید.`);
        validCodeFound = true;
    } else if (text === agent_discount.code && agent_discount.percent > 0) {
        userData.appliedDiscount = agent_discount.percent;
        await sendMessage(chatId, `✅ کد تخفیف نمایندگان با موفقیت اعمال شد! شما ${agent_discount.percent}% تخفیف دریافت کرده‌اید.`);
        validCodeFound = true;
    }

    userData.state = null;

    if (!validCodeFound) {
        delete userData.appliedDiscount;
        await sendMessage(chatId, '❌ کد تخفیف وارد شده نامعتبر است.');
    }

    userCache.set(userId, userData);
    await showPaymentOptions(chatId, userId, userData.selectedPlan);
}


async function handleAdminSettingsInput(text, chatId, userId, env) {
    const userData = userCache.get(userId) || {};
    const botSettings = await getSettings();
    const state = userData.state;
    userData.state = null; 

    if (state === 'setting_discount_code') {
        botSettings.discount.code = text;
        await updateSettings(env, botSettings);
        await sendMessage(chatId, `✅ کد تخفیف کاربران تنظیم شد: ${text}`);
        userData.state = 'setting_discount_percent';
        await sendMessage(chatId, 'لطفاً درصد تخفیف کاربران را وارد کنید (عدد بین 0 تا 100):');
    } else if (state === 'setting_discount_percent') {
        const percent = parseInt(text, 10);
        if (!isNaN(percent) && percent >= 0 && percent <= 100) {
            botSettings.discount.percent = percent;
            await updateSettings(env, botSettings);
            await sendMessage(chatId, `✅ درصد تخفیف کاربران تنظیم شد: ${percent}%`);
            await showDiscountMenu(chatId, userId, env);
            return;
        } else {
            await sendMessage(chatId, '❌ درصد نامعتبر. لطفاً عدد بین 0 تا 100 وارد کنید.');
            await showDiscountMenu(chatId, userId, env);
            return;
        }
    } else if (state === 'setting_agent_discount_code') {
        botSettings.agent_discount.code = text;
        await updateSettings(env, botSettings);
        await sendMessage(chatId, `✅ کد تخفیف نمایندگان تنظیم شد: ${text}`);
        userData.state = 'setting_agent_discount_percent';
        await sendMessage(chatId, 'لطفاً درصد تخفیف نمایندگان را وارد کنید (عدد بین 0 تا 100):');
    } else if (state === 'setting_agent_discount_percent') {
        const percent = parseInt(text, 10);
        if (!isNaN(percent) && percent >= 0 && percent <= 100) {
            botSettings.agent_discount.percent = percent;
            await updateSettings(env, botSettings);
            await sendMessage(chatId, `✅ درصد تخفیف نمایندگان تنظیم شد: ${percent}%`);
            await showDiscountMenu(chatId, userId, env);
            return;
        } else {
            await sendMessage(chatId, '❌ درصد نامعتبر. لطفاً عدد بین 0 تا 100 وارد کنید.');
            await showDiscountMenu(chatId, userId, env);
            return;
        }
    } else if (state === 'adding_card') {
        const parts = text.split('-').map(p => p.trim());
        if (parts.length === 2) {
            await addCard(env, parts[0], parts[1]);
            await sendMessage(chatId, `✅ کارت با موفقیت اضافه شد:\nشماره: ${parts[0]}\nنام: ${parts[1]}`);
            await showCardManagementMenu(chatId, userId, env);
        } else {
            await sendMessage(chatId, '❌ فرمت ورودی صحیح نیست. لطفا مجددا تلاش کنید.');
            await showCardManagementMenu(chatId, userId, env);
        }
    } else if (state === 'setting_channel_id') {
        let channelId = text.trim();
        if (!channelId.startsWith('@') && !channelId.startsWith('-100')) {
            channelId = '@' + channelId;
        }
        botSettings.channel_lock.channel_id = channelId;
        await updateSettings(env, botSettings);
        await sendMessage(chatId, `✅ آیدی کانال روی ${channelId} تنظیم شد.`);
        await showChannelLockMenu(chatId, userId, env);
    }

    userCache.set(userId, userData);
    if (!userData.state) {
        await showAdminMenu(chatId, userId, env);
    }
}


async function showV2rayPlans(chatId, userId, env, msgId = null, isPhoto = false) {
    const botSettings = await getSettings();
    const buttons = [
        [{ text: `1 ماهه 2 کاربر (${V2RAY.plan_1m2u.price.toLocaleString('en-US')} تومان)`, callback_data: 'plan_1m2u' }],
        [{ text: `3 ماهه 3 کاربر (${V2RAY.plan_3m3u.price.toLocaleString('en-US')} تومان)`, callback_data: 'plan_3m3u' }],
        [{ text: `6 ماهه 6 کاربر (${V2RAY.plan_6m4u.price.toLocaleString('en-US')} تومان)`, callback_data: 'plan_6m4u' }],
        [{ text: `12 ماهه 6 کاربر (${V2RAY.plan_12m6u.price.toLocaleString('en-US')} تومان)`, callback_data: 'plan_12m6u' }],
        [{ text: '↩️ بازگشت', callback_data: 'buy' }]
    ];  
  
    if (botSettings.free_test_status) {
        buttons.unshift([{ text: 'تست 1 روزه حجم نامحدود (رایگان)', url: `https://expreset.pages.dev/` }]);
    }

    const text = `🚀 *سرویس اختصاصی V2Ray*

✨ *تجربه‌ای متفاوت از اینترنت آزاد*
سرعت بی‌نظیر و پایداری ۱۰۰٪ را با سرورهای اختصاصی ما تجربه کنید\\.

💎 *ویژگی‌های برجسته:*
⚡️ *سرعت موشکی:* باز کردن آنی اینستاگرام و یوتیوب
🎮 *پینگ پایین:* مناسب برای گیم و تماس صوتی
♾ *ترافیک نامحدود:* دانلود و آپلود بدون نگرانی
📱 *سازگار:* اتصال فوری در آیفون، اندروید و ویندوز

🌍 *لوکیشن‌های محبوب:*
🇩🇪 آلمان 🇳🇱 هلند 🇺🇸 آمریکا 🇹🇷 ترکیه 🇫🇷 فرانسه

👇 *اشتراک خود را انتخاب کنید:*`;

    await sendOrEditMessage(chatId, msgId, isPhoto, text, buttons);
}
  
async function showExpressPlans(chatId, msgId = null, isPhoto = false) {
    const text = `💎 *سرویس پریمیوم ExpressVPN*
🥇 *معتبرترین فیلترشکن جهان*

اگر به دنبال امنیت نظامی و آی\\-پی ثابت برای ترید یا کارهای حساس هستید، این سرویس بهترین انتخاب است\\.

🔥 *چرا ExpressVPN؟*
🛡 *امنیت مطلق:* رمزنگاری AES\\-256
🌍 *دسترسی جهانی:* بیش از ۱۰۵ کشور
📱 *آی\\-پی ثابت:* حیاتی برای بایننس و کوکوین
⚡️ *بدون افت سرعت:* زیرساخت قدرتمند و پایدار

با خرید این محصول، شما تأیید می‌کنید که در صورت بروز اختلال در سرورهای ExpressVPN و عدم امکان تحویل مستقیم ایمیل و پسورد، کانفیگ‌های Express در قالب V2Ray برای شما ارسال شود\\. 🔐⚡️

👇 *دوره اشتراک را انتخاب کنید:*`;

    const buttons = [
        [{ text: `1 ماهه 1 کاربر (${EXPRESS.explan_1m1u.price.toLocaleString('en-US')} تومان)`, callback_data: 'explan_1m1u' }],
        [{ text: `3 ماهه 1 کاربر (${EXPRESS.explan_3m1u.price.toLocaleString('en-US')} تومان)`, callback_data: 'explan_3m1u' }],
        [{ text: `12 ماهه 1 کاربر (${EXPRESS.explan_12m1u.price.toLocaleString('en-US')} تومان)`, callback_data: 'explan_12m1u' }],
        [{ text: '↩️ بازگشت', callback_data: 'buy' }]
    ];

    await sendOrEditMessage(chatId, msgId, isPhoto, text, buttons);
}

async function handleCardPayment(chatId, userId, planKey, env, msgId = null, isPhoto = false) {
    const userData = userCache.get(userId) || {};
    const plan = allPlans[planKey] || V2RAY.plan_1m2u;
    const amount = userData.paymentAmount || plan.price;
    if (!amount) {
        await sendMessage(chatId, '⚠️ خطا: مبلغ پرداخت یافت نشد. لطفاً دوباره پلن را انتخاب کنید.');
        await showMainMenu(chatId, userId, env);
        return;
    }
    userData.payment = { type: 'card', plan: planKey, amount, timestamp: new Date().toISOString(), status: 'pending' };
    userCache.set(userId, userData);
    await updateUserLastPlan(env, userId, planKey);

    const cards = await getAllCards(env);
    const selectedCardInfo = cards.length > 0 
        ? cards[Math.floor(Math.random() * cards.length)]
        : { card_number: 'نامشخص', owner_name: 'نامشخص' };
    
    const amountInRials = amount * 10;
    
    const paymentInfo = `💳 *تصویر رسید واریزی را ارسال کنید:*

\`${selectedCardInfo.card_number}\`
به نام *${selectedCardInfo.owner_name}*

مبلغ: *${amountInRials.toLocaleString('en-US')} ریال*

❌ *نکته مهم:* هنگام انتقال وجه در توضیحات بانک از نوشتن مواردی چون بابت خرید فیلترشکن یا وی پی ان و موارد این چنینی جدا خودداری کنید
❌ لطفا از رند کردن مبلغ خودداری کنید و مبلغ را به صورت دقیق واریز نمایید`;

    const buttons = [
        [
            { text: '📋 کپی شماره کارت', copy_text: { text: selectedCardInfo.card_number } },
            { text: '📋 کپی مبلغ (ریال)', copy_text: { text: amountInRials.toString() } }
        ],
        [{ text: '↩️ لغو سفارش و بازگشت', callback_data: 'back_main' }]
    ];

    await sendOrEditMessage(chatId, msgId, isPhoto, paymentInfo, buttons);
}

async function handleCryptoPayment(chatId, userId, planKey, msgId = null) {
    const userData = userCache.get(userId) || {};
    const plan = allPlans[planKey] || V2RAY.plan_1m2u;
    const amountToman = userData.paymentAmount || plan.price;

    if (msgId) await deleteMessage(chatId, msgId);
    
    const waitMsg = await sendMessage(chatId, '⏳ در حال محاسبه نرخ لحظه‌ای ترون\\.\\.\\. ', null, false);

    const trxPriceToman = await getTrxPrice();
    
    if (waitMsg && waitMsg.result && waitMsg.result.message_id) {
        try {
            await deleteMessage(chatId, waitMsg.result.message_id);
        } catch (e) { console.error('Error deleting wait message', e); }
    }

    if (!trxPriceToman) {
        await sendMessage(chatId, '⚠️ خطا در دریافت نرخ ارز. لطفا دقایقی دیگر تلاش کنید یا از روش کارت به کارت استفاده کنید.', [[{ text: '↩️ بازگشت', callback_data: 'back_main' }]]);
        return;
    }

    const amountTrx = parseFloat((amountToman / trxPriceToman).toFixed(2));
    const paymentData = await createNowPayment(amountTrx);

    if (!paymentData || !paymentData.pay_address) {
        await sendMessage(chatId, '⚠️ خطا در ایجاد درگاه پرداخت. لطفا دقایقی دیگر تلاش کنید.', [[{ text: '↩️ بازگشت', callback_data: 'back_main' }]]);
        return;
    }

    userData.pendingPayment = {
        type: 'crypto',
        plan: planKey,
        payment_id: paymentData.payment_id,
        amount_trx: amountTrx,
        address: paymentData.pay_address
    };
    userCache.set(userId, userData);

    
    const msg = `💎 *فاکتور پرداخت ارز دیجیتال*

💰 مبلغ قابل پرداخت: \`${amountTrx}\` ترون \\(TRX\\)
⚠️ شبکه: *TRC20*

🏦 آدرس کیف پول:
\`${paymentData.pay_address}\`

⚠️ *نکات مهم:*
❗️ حتماً در شبکه *TRC20* واریز کنید
❗️ مبلغ را دقیق و بدون تغییر واریز کنید 
❗️ پس از واریز، ۱ تا ۵ دقیقه صبر کنید و دکمه بررسی را بزنید`;

    const buttons = [
        [{ text: '📋 کپی آدرس کیف پول', copy_text: { text: paymentData.pay_address } }],
        [{ text: '✅ بررسی وضعیت پرداخت', callback_data: 'check_payment' }],
        [{ text: '↩️ لغو سفارش و بازگشت', callback_data: 'back_main' }]
    ];

    await sendMessage(chatId, msg, buttons, false);
}

async function showPaymentOptions(chatId, userId, planKey, msgId = null, isPhoto = false) {
    const userData = userCache.get(userId) || {};
    const plan = allPlans[planKey] || V2RAY.plan_1m2u;
    let price = plan.price;
    let discountMessage = '';
    if (userData.appliedDiscount) {
        const discountAmount = (price * userData.appliedDiscount) / 100;
        price -= discountAmount;
        discountMessage = `\n🎉 تخفیف *${userData.appliedDiscount}%* اعمال شد\\!`;
    }
    const randomAmount = Math.round(price + Math.floor(Math.random() * 2000) + 1000);
    userData.paymentAmount = randomAmount;
    userData.selectedPlan = planKey;
    userCache.set(userId, userData);

    const buttons = [
        [{ text: '💳 کارت به کارت', callback_data: `card|${planKey}` }],
        [{ text: '💎 پرداخت با ارز دیجیتال (ترون)', callback_data: `crypto|${planKey}` }]
    ];

    if (!userData.appliedDiscount) {
        buttons.push([{ text: '🎁 کد تخفیف دارم', callback_data: 'enter_discount_code' }]);
    }
    buttons.push([{ text: '↩️ بازگشت', callback_data: 'back_main' }]);

    const text = `🌐 شما در حال خرید اشتراک *${escapeMarkdown(plan.label)}* با مبلغ قابل پرداخت *${randomAmount.toLocaleString('en-US')}* تومان هستید${discountMessage}\n\n✨ لطفا روش پرداخت را انتخاب کنید:`;

    await sendOrEditMessage(chatId, msgId, isPhoto, text, buttons);
}

async function showBuyMenu(chatId, userId, botSettings, msgId = null, isPhoto = false) {
    if (!botSettings.status && userId.toString() !== ADMIN_ID) {
        await deleteMessage(chatId, msgId);
        await sendMessage(chatId, '🚨 *به دلیل استقبال غیرقابل پیش‌بینی شما عزیزان و ارتقاء کیفیت سرورها* 💻⚡\n\n📦 فروش موقتاً بسته شد تا بهترین تجربه رو براتون فراهم کنیم\\!\n\n\n⏰ فروش دوباره در ساعت خاصی از روز که در کانال اعلام میکنیم باز میشه، پس حواست باشه\\!\nبا ما وصل بمون تا لحظه شروع رو از دست ندی 🔔\n\n\n@Expreset', [[{ text: '↩️ بازگشت', callback_data: 'back_main' }]], false);
    } else {
        const text = `🌟 *محصول مورد نظر را انتخاب کنید:*`;
        const buttons = [
            [{ text: '🚀 فیلترشکن V2ray', callback_data: 'v2ray_plan' }],
            [{ text: '❤️‍🔥 فیلترشکن Express ', callback_data: 'express_plan' }],
            [{ text: '↩️ بازگشت', callback_data: 'back_main' }]
        ];
        await sendOrEditMessage(chatId, msgId, isPhoto, text, buttons);
    }
}

async function showAdminMenu(chatId, userId, env, msgId = null, isPhoto = false) {
    const botSettings = await getSettings();
    const userCount = await getUserCount(env);
    const statusText = botSettings.status ? '✅ فعال' : '❌ غیرفعال';
    const freeTestText = botSettings.free_test_status ? '✅ فعال' : '❌ غیرفعال';
    
    const text = `👮‍♂️ *منوی مدیریت ربات*\n\n📊 *آمار و وضعیت:*\n👥 تعداد کاربران: \`${userCount}\` نفر\n🤖 وضعیت ربات: ${escapeMarkdown(statusText)}\n🎁 وضعیت تست رایگان: ${escapeMarkdown(freeTestText)}\n\n👇 از دکمه‌ها برای مدیریت استفاده کنید:`;
    
    const inlineKeyboard = [
        [{ text: `🤖 وضعیت ربات (${statusText})`, callback_data: 'toggle_status' }],
        [{ text: `🧩 وضعیت تست رایگان (${freeTestText})`, callback_data: 'toggle_freetest' }],
        [{ text: '📢 ارسال تبلیغات هدفمند', callback_data: 'target_ads_menu' }],
		[{ text: '🔐 مدیریت قفل عضویت کانال', callback_data: 'manage_channel_lock' }],
        [{ text: '💳 مدیریت کارت‌ها', callback_data: 'manage_cards' }],
        [{ text: '🎟 مدیریت کد تخفیف', callback_data: 'manage_discounts' }],
        [{ text: '↩️ بازگشت به منوی اصلی', callback_data: 'back_main' }]
    ];
    
    await sendOrEditMessage(chatId, msgId, isPhoto, text, inlineKeyboard);
}

async function showChannelLockMenu(chatId, userId, env, msgId = null, isPhoto = false) {
    const botSettings = await getSettings();
    const lockStatus = botSettings.channel_lock && botSettings.channel_lock.status ? '🔒 فعال' : '🔓 غیرفعال';
    const channelId = botSettings.channel_lock && botSettings.channel_lock.channel_id ? botSettings.channel_lock.channel_id : 'تنظیم نشده';

    const text = `📢 *مدیریت قفل عضویت در کانال*\n\nوضعیت قفل: ${lockStatus}\nکانال فعلی: \`${escapeMarkdown(channelId)}\`\n\n⚠️ نکته: ربات باید در کانال مورد نظر ادمین باشد تا بتواند وضعیت عضویت را بررسی کند\\.\n\n👇 یک گزینه را انتخاب کنید:`;

    const inlineKeyboard = [
        [{ text: botSettings.channel_lock && botSettings.channel_lock.status ? '🔓 غیرفعال کردن قفل' : '🔒 فعال کردن قفل', callback_data: 'toggle_channel_lock' }],
        [{ text: '➕ تنظیم/تغییر آیدی کانال', callback_data: 'set_channel_id' }],
        [{ text: '❌ حذف کانال', callback_data: 'remove_channel_id' }],
        [{ text: '↩️ بازگشت به مدیریت', callback_data: 'admin_menu' }]
    ];

    await sendOrEditMessage(chatId, msgId, isPhoto, text, inlineKeyboard);
}

async function showDiscountMenu(chatId, userId, env, msgId = null, isPhoto = false) {
    const botSettings = await getSettings();
    const userCode = botSettings.discount && botSettings.discount.code ? `${botSettings.discount.code} (${botSettings.discount.percent}%)` : '⛔️ غیرفعال';
    const agentCode = botSettings.agent_discount && botSettings.agent_discount.code ? `${botSettings.agent_discount.code} (${botSettings.agent_discount.percent}%)` : '⛔️ غیرفعال';

    const text = `🎟 *پنل مدیریت کدهای تخفیف*\n\nدر این بخش می‌توانید کدهای تخفیف کاربران عادی و نمایندگان فروش را مدیریت کنید\\.\n\n👤 وضعیت تخفیف کاربران:\n\`${escapeMarkdown(userCode)}\`\n\n🤝 وضعیت تخفیف نمایندگان:\n\`${escapeMarkdown(agentCode)}\`\n\n👇 یک گزینه را انتخاب کنید:`;
    
    const inlineKeyboard = [
        [{ text: '➕ ثبت کد تخفیف کاربر', callback_data: 'set_discount' }, { text: '❌ حذف', callback_data: 'delete_discount_user' }],
        [{ text: '➕ ثبت کد تخفیف نماینده', callback_data: 'set_agent_discount' }, { text: '❌ حذف', callback_data: 'delete_discount_agent' }],
        [{ text: '↩️ بازگشت به مدیریت اصلی', callback_data: 'admin_menu' }]
    ];
    
    await sendOrEditMessage(chatId, msgId, isPhoto, text, inlineKeyboard);
}

async function showCardManagementMenu(chatId, userId, env, msgId = null, isPhoto = false) {
    const cards = await getAllCards(env);
    let text = '💳 *مدیریت کارت‌ها:*\n\n';
    const inlineKeyboard = [];

    if (cards.length === 0) {
        text += 'هیچ کارتی ثبت نشده است\\.';
    } else {
        cards.forEach((card, index) => {
            text += `${index + 1}\\. \`${card.card_number}\`\n   به نام: ${card.owner_name}\n`;
            inlineKeyboard.push([{ text: `❌ حذف کارت ${card.card_number.slice(-4)}`, callback_data: `delete_card_${card.id}` }]);
        });
    }

    inlineKeyboard.push([{ text: '➕ افزودن کارت جدید', callback_data: 'add_card' }]);
    inlineKeyboard.push([{ text: '↩️ بازگشت', callback_data: 'admin_menu' }]);

    await sendOrEditMessage(chatId, msgId, isPhoto, text, inlineKeyboard);
}

async function showTargetedAdsMenu(chatId, userId, env, msgId = null, isPhoto = false) {
    const text = `📢 *ارسال تبلیغات هدفمند*\n\nدر این بخش می‌توانید یک پیام تبلیغاتی برای جذب کاربران ایجاد و برای 10 نفر از کاربران به‌صورت رندوم ارسال کنید\\.\n\n👇 لطفاً روش ساخت تبلیغ را انتخاب کنید:`;
    const inlineKeyboard = [
        [{ text: '🤖 ایجاد تبلیغ با AI', callback_data: 'create_ad_ai' }],
        [{ text: '✍️ ایجاد دستی تبلیغ', callback_data: 'create_ad_manual' }],
        [{ text: '↩️ بازگشت', callback_data: 'admin_menu' }]
    ];
    await sendOrEditMessage(chatId, msgId, isPhoto, text, inlineKeyboard);
}

async function handleAdCreationInput(data, chatId, userId, env) {
    let userData = userCache.get(userId) || {};
    let draft = {};

    if (data.message.text) {
        draft = { type: 'text', content: data.message.text };
    } else if (data.message.photo) {
        const largestPhoto = data.message.photo.pop();
        draft = { 
            type: 'photo', 
            file_id: largestPhoto.file_id, 
            caption: data.message.caption || ''
        };
    } else {
        await sendMessage(chatId, '❌ لطفاً فقط متن یا عکس ارسال کنید.');
        return new Response('OK', { status: 200 });
    }

    userData.draftAd = draft;
    userCache.set(userId, userData);

    await showAdPreview(chatId, userId, draft);
    return new Response('OK', { status: 200 });
}

async function generateAiAd(chatId, userId, env, msgId) {
    await sendOrEditMessage(chatId, msgId, false, '⏳ در حال نوشتن متن تبلیغاتی \\.\\.\\.', []);
    
    const prompt = `یک متن تبلیغاتی بسیار جذاب، کوتاه و هیجان‌انگیز برای کانال تلگرام بنویس که هدفش جذب کاربر برای ربات خرید فیلترشکن است.
    متن باید بین 200 تا 400 کارکتر باشد
    
        ویژگی‌هایی که باید در متن باشد:
        1. اشاره به اینترنت ضعیف محدودیت ها و فیلترشکن های کلافه کننده 😫
        2. وعده سرعت نور و وب‌گردی بدون مرز. 🚀
        3. معرفی سرویس‌های V2Ray و ExpressVPN به عنوان راه حل نهایی. 🛡️
        4. اشاره به "تست رایگان" برای اطمینان از کیفیت. 🤩
        5. استفاده از ایموجی‌های جذاب و مرتبط.
        6. لحن دوستانه، محاوره‌ای و ترغیب‌کننده.
        7. متن نباید خیلی طولانی باشد (حدود 4-5 پاراگراف کوتاه).
        8. کلمات نباید در قالب ** قرار بگیرن مثل: **اینترنت**
        9. در متن اشاره ای به لینک یا ایدی ربات نکن فقط بگو روی دکمه زیر کلیک کنید
    
        خروجی باید فقط متن نهایی باشد بدون هیچ توضیحات اضافه‌ای.`;
     
    const { aiResponse } = await getAiResponse(prompt, '');
    
    if (!aiResponse || aiResponse.includes('خطا')) {
        await sendMessage(chatId, '❌ خطا در تولید متن. لطفاً دوباره تلاش کنید.', [[{text:'↩️ بازگشت', callback_data:'target_ads_menu'}]]);
        return;
    }

    const userData = userCache.get(userId) || {};
    userData.draftAd = { type: 'text', content: aiResponse };
    userCache.set(userId, userData);

    await showAdPreview(chatId, userId, userData.draftAd);
}

async function showAdPreview(chatId, userId, draft) {
    const confirmationKeyboard = [
        [{ text: '✅ تایید و ارسال برای 10 نفر', callback_data: 'confirm_send_ads' }],
        [{ text: '❌ لغو و بازگشت', callback_data: 'cancel_ads' }]
    ];
    
    const botButton = [[{ text: 'ورود به ربات', url: 'https://t.me/ExpresetBot?start=true' }]];

    await sendMessage(chatId, '👁 *پیش‌نمایش تبلیغ شما:*', null, false);

    if (draft.type === 'text') {
        await sendMessage(chatId, draft.content, botButton, true);
    } else {
        await sendPhoto(chatId, draft.file_id, escapeMarkdown(draft.caption), botButton);
    }

    await sendMessage(chatId, '❓ موافق ارسال این متن به 10 نفر هستید؟', confirmationKeyboard, false);
}

async function broadcastAd(chatId, userId, env, msgId) {
    const userData = userCache.get(userId) || {};
    const draft = userData.draftAd;
    
    if (!draft) {
        await answerCallbackQuery(userId, '❌ تبلیغی یافت نشد.');
        await showTargetedAdsMenu(chatId, userId, env);
        return;
    }

    await deleteMessage(chatId, msgId);
    await sendMessage(chatId, '🚀 در حال ارسال تبلیغات به 10 کاربر تصادفی...', null, false);

    try {
        const { results } = await env.DB.prepare("SELECT user_id FROM users ORDER BY RANDOM() LIMIT 10").all();
        
        if (!results || results.length === 0) {
            await sendMessage(chatId, '⚠️ کاربری در دیتابیس یافت نشد.');
            return;
        }

        const botButton = [[{ text: 'ورود به ربات', url: 'https://t.me/ExpresetBot?start=true' }]];
        
        const promises = results.map(async (row) => {
            try {
                if (draft.type === 'text') {
                    await sendMessage(row.user_id, draft.content, botButton, true);
                } else {
                    await sendPhoto(row.user_id, draft.file_id, escapeMarkdown(draft.caption), botButton);
                }
            } catch (e) {
            }
        });

        await Promise.all(promises);

        userData.state = null;
        userCache.set(userId, userData);

        const buttons = [
             [{ text: '🔄 ارسال مجدد (10 نفر دیگر)', callback_data: 'confirm_send_ads' }],
             [{ text: '↩️ بازگشت', callback_data: 'admin_menu' }]
        ];

        await sendMessage(chatId, `✅ تبلیغ با موفقیت برای ${results.length} نفر ارسال شد.`, buttons);

    } catch (error) {
        console.error('Broadcast Error:', error);
        await sendMessage(chatId, '❌ خطا در ارسال تبلیغات: ' + error.message);
    }
}

async function editMessageText(chatId, messageId, text, inlineKeyboard = null) {
    const payload = { chat_id: chatId, message_id: messageId, text: text, parse_mode: 'MarkdownV2' };
    if (inlineKeyboard) payload.reply_markup = { inline_keyboard: inlineKeyboard };
    await telegramApiCall('editMessageText', payload);
}

async function editMessageCaption(chatId, messageId, caption, inlineKeyboard = null) {
    const payload = { chat_id: chatId, message_id: messageId, caption: caption, parse_mode: 'MarkdownV2' };
    if (inlineKeyboard) payload.reply_markup = { inline_keyboard: inlineKeyboard };
    await telegramApiCall('editMessageCaption', payload);
}

async function sendOrEditMessage(chatId, msgId, isPhoto, text, inlineKeyboard) {
    if (msgId && !isPhoto) {
        try {
            const res = await telegramApiCall('editMessageText', {
                chat_id: chatId,
                message_id: msgId,
                text: text,
                parse_mode: 'MarkdownV2',
                reply_markup: { inline_keyboard: inlineKeyboard }
            });
            if (res.ok) return;
        } catch (e) {
        }
    }
    
    if (msgId) {
        try { await deleteMessage(chatId, msgId); } catch(e) {}
    }
    await sendMessage(chatId, text, inlineKeyboard, false);
}

async function showMainMenu(chatId, userId, env, msgId = null, isPhoto = false) {
    let userData = userCache.get(userId) || {};
    const botSettings = await getSettings();
    const userSettings = await getUserSettingsD1(env, userId);
    const now = Date.now();

    const lastPinned = userSettings.last_pinned_message_at || 0;
    const oneMonthMs = 30 * 24 * 60 * 60 * 1000; 

    if (now - lastPinned > oneMonthMs) {
        const warningText = `🚨 *اخطار: فریب تبلیغ جعلی بالای ربات را نخورید* 👇`;
        const sentMsg = await sendMessage(chatId, warningText, null, false);
        
        if (sentMsg && sentMsg.result) {
            try {
                await telegramApiCall('pinChatMessage', { chat_id: chatId, message_id: sentMsg.result.message_id });
                await updateUserSettingsD1(env, userId, { last_pinned_message_at: now });
            } catch (e) {
                console.error('Failed to pin message:', e);
            }
        }
    }

    const lastVoice = userSettings.last_voice_sent_at || 0;
    const oneWeekMs = 7 * 24 * 60 * 60 * 1000; 

    if (now - lastVoice > oneWeekMs) {
        await telegramApiCall('sendVoice', {
            chat_id: chatId,
            voice: 'AwACAgQAAxkBAAEPmTRoIR0wK7fgDsSlzXivqY3zCI2b1wACxzQAAlBjCVGud3GadnwK_DYE',
            caption: 'قبل از هرچیز این ویس رو گوش کن 😊👆',
        });
        await updateUserSettingsD1(env, userId, { last_voice_sent_at: now });
    }


    let inlineKeyboard = [];



    inlineKeyboard.push(
        [{ text: '🛍  خرید و تست رایگان فیلترشکن', callback_data: 'buy' }],
        [{ text: '👩‍💻 گفتگو با پشتیبان آنلاین', callback_data: 'support_loop' }]
    );  
	
	    if (botSettings.free_test_status) {
        inlineKeyboard.push([{ text: '🦖 رفیقاتو دعوت کن، هدیه بگیر', url: `https://t.me/VPNDinoBot?start=ads` }]);
    }  

    if (userId.toString() === ADMIN_ID) {
        inlineKeyboard.push([{ text: '⚙️ مدیریت ربات', callback_data: 'admin_menu' }]);
    }

    const text = `🌍 *به ربات فیلترشکن خوش آمدید:*\n\n🔐 با ما، اینترنت آزاد و ایمن را در آغوش بگیرید\n🌍 دسترسی نامحدود به اینترنت با امنیت کامل\n\n📌 *جهت استفاده از ربات لطفا یکی از موارد زیر را انتخاب کنید:*`;

    await sendOrEditMessage(chatId, msgId, isPhoto, text, inlineKeyboard);
}

async function answerCallbackQuery(callbackQueryId, text = '', showAlert = false) {
    await telegramApiCall('answerCallbackQuery', { callback_query_id: callbackQueryId, text, show_alert: showAlert });
}

async function setSupport(userId, flag) {
    let userData = userCache.get(userId) || {};
    userData.inSupport = flag;
    userCache.set(userId, userData);
}

async function isInSupport(userId) {
    const userData = userCache.get(userId) || {};
    return !!userData.inSupport;
}

async function getAiResponse(prompt, previousUserMessage) {
    try {      
        const model = 'gemini-2.5-flash';
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;

        const systemInstruction = `## 🎯 نقش و هویت اصلی: کارشناس ارشد پشتیبانی ExpressVPN و V2Ray

        شما، کارشناس ارشد پشتیبانی مشتریان فروشگاه، هستید. وظیفه شما ارائه خدمات درجه یک، سریع، بسیار دوستانه و کاملاً حرفه‌ای به مشتریان ایرانی به زبان فارسی است. هدف نهایی شما این است که هر تعاملی، حس اعتماد، شایستگی و سهولت استفاده از خدمات ما (خرید یا رفع مشکل) را به مشتری منتقل کند.       
        شما باید به نحوی پاسخ دهید که مشتری حس کند یک **انسان آگاه و دلسوز** در حال چت کردن با اوست، نه یک ربات. پاسخ‌ها باید عمیقاً نیت اصلی سؤال مشتری را درک کرده و بهینه‌ترین، نزدیک‌ترین و کامل‌ترین راه حل را ارائه دهند.
        
        ### 📝 دستورالعمل‌های کلیدی تعامل (سبک و محتوا)
        
        1.  **لحن و سبک:** لحن شما باید همواره **بسیار حرفه‌ای، دوستانه، صمیمی، و در عین حال اطمینان‌بخش** باشد. از جملات کوتاه، مؤثر و کاربردی استفاده کنید.
        2.  **درک عمیق:** ابتدا **هدف اصلی مشتری** (مثلاً اتصال ناموفق، نیاز به لوکیشن خاص، استعلام قیمت) را کاملاً درک کنید. پاسخ شما باید مستقیماً و به بهترین شکل به همان هدف بپردازد.
        3.  **اولویت‌بندی:** تمرکز اصلی پاسخ‌ها باید بر **حل فوری مشکل اتصال** یا **راهنمایی روان فرآیند خرید/تمدید** باشد.
        4.  **استفاده هوشمندانه از ایموجی:** از ایموجی‌های مرتبط (🌐🚀🔒) در محل‌های مناسب برای افزایش صمیمیت و وضوح استفاده کنید، اما از شلوغ کردن متن بپرهیزید.
        5.  **ارائه مزایای رقابتی (در صورت لزوم):** در صورت طرح سؤال درباره کیفیت، بر ویژگی‌های **حجم نامحدود 🚀، پینگ بسیار پایین برای گیمینگ 🎮 و امنیت کامل (Encryption) 🔒** روی تمامی دستگاه‌ها تأکید کنید.
        
        ### 📍 اطلاعات خدمات و لوکیشن‌ها
        
        * **فیلترشکن‌ها:** V2Ray و ExpressVPN.
        * **لوکیشن‌های فعال:** آلمان 🇩🇪، سوئد 🇸🇸، آمریکا 🇺🇸، ایتالیا 🇮🇹، ترکیه 🇹🇷، هلند 🇳🇱، امارات 🇦🇪، کانادا 🇨🇦، انگلیس 🇬🇧، فنلاند 🇫🇮. فرانسه، 
        
        #### 💲 تعرفه و قیمت‌ها (هزار تومان)
        
        | محصول | مدت زمان | تعداد کاربر | قیمت (هزار تومان) |
        | :--- | :--- | :--- | :--- |
        | **ExpressVPN** | 1 ماهه | تک کاربر | 139 |
        | **ExpressVPN** | 3 ماهه | تک کاربر | 269 |
        | **ExpressVPN** | 12 ماهه | تک کاربر | 649 |
        | **V2Ray** | 1 ماهه | 2 کاربر | 159 |
        | **V2Ray** | 3 ماهه | 3 کاربر | 399 |
        | **V2Ray** | 6 ماهه | 6 کاربر | 599 |
        | **V2Ray** | 12 ماهه | 10 کاربر | 999 |
        
        ### 🛑 سناریوهای خاص (پاسخ‌های استاندارد حرفه‌ای)
        
        1.  **راهنمایی خرید یا تست:** برای هرگونه سؤال درباره نحوه خرید، قیمت یا درخواست تست رایگان، کاربر را به **منوی اصلی (با تأکید بر سادگی فرآیند)** هدایت کنید و از عبارت‌هایی مانند "برای شروع یک خرید سریع و امن، لطفاً به منوی اصلی مراجعه بفرمایید 🛒." استفاده کنید.
        2.  **همکاری/عمده‌فروشی:** برای هرگونه سؤال درباره پنل همکاری یا فروش عمده، مستقیماً به آیدی اختصاصی **@ExpresetSupport** ارجاع دهید و بگویید: "برای اطلاعات کامل همکاری و عمده‌فروشی، لطفاً به همکاران ما در بخش مربوطه (@ExpresetSupport) پیام دهید 📞."
        3.  **ابهام در اکانت دریافتی:** اگر مشتری در مورد نوع اکانت (V2Ray vs Express) اشتباهی اعتراض کرد: اکانت‌های ارسالی کاملاً خودکار و بر اساس سفارش شما هستند. گاهی اوقات با توج به شرایط شبکه و سرور های اکسپرس وی پی ان، اکانت جایگزین ویتوری حتی با کیفیت بالاتر برای شما ارسال میشه."
        4.  **مشکل اتصال عمومی:** "بله، حتماً مشکل اتصال شما رو حل می‌کنیم! 🛠️ لطفاً قبل از هر چیز، **نوع فیلترشکن و لوکیشنی که در حال حاضر استفاده می‌کنید** و **نوع دستگاهتون (اندروید/iOS/ویندوز)** رو بفرمایید تا دقیق‌ترین راهنمایی رو ارائه کنم. 🚀"
        5.     عودت وجه (Refund): اگر مشتری درخواست بازگشت پول کرد، ابتدا تلاش کنید مشکل اتصال را حل کنید. با لحنی همدلانه بگوئید: "متأسفم که تجربه خوبی نداشتید 😔. قبل از ثبت درخواست عودت، اجازه بدید مشکل اتصال شما رو بررسی کنیم؛ احتمالاً با یک تغییر کوچک حل بشه. لطفاً لوکیشن و نوع دستگاهتون رو بفرمایید. اگر پس از راهنمایی ما مشکل حل نشد، طبق قوانین فروشگاه برای بررسی و پیگیری بازگشت وجه به بخش مالی ارجاع داده خواهید شد. واحد مالی: t.me/ExpresetSupport"

        ### ❌ محدودیت‌های محتوایی
        
        * هرگز نگوئید که یک مدل زبانی یا هوش مصنوعی هستید.
        * از محتوای توهین‌آمیز، غیراخلاقی، یا ناقض حریم خصوصی کاربران خودداری کنید.`;

        const userPrompt = `Context (Previous Message): ${previousUserMessage}\n\nCurrent Message: ${prompt}`;
      
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{ parts: [{ text: userPrompt }] }],
                system_instruction: { parts: [{ text: systemInstruction }] }
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Gemini API Error:', errorData);
            return { aiResponse: "⚠️ خطا در سرویس پشتیبانی هوشمند" };
        }

        const data = await response.json();
        const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "پاسخ نامشخص از سرویس هوش مصنوعی";
        return { aiResponse };
    } catch (error) {
        console.error(`Gemini Error: ${error.message}`);
        return { aiResponse: "⚠️ خطا در سرویس پشتیبانی هوشمند" };
    }
}


async function putKV(key, value) {
    await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/storage/kv/namespaces/${KV_NAMESPACE_ID}/values/${key}`,
        {
            method: 'PUT',
            headers: {
                'X-Auth-Email': CF_EMAIL,
                'X-Auth-Key': CF_API_KEY,
                'Content-Type': 'text/plain'
            },
            body: value,
        }
    );
}  

async function deleteMessage(chatId, messageId) {
    await telegramApiCall('deleteMessage', { chat_id: chatId, message_id: messageId });
}

async function sendPhoto(chatId, photoUrl, caption, inlineKeyboard = null) {
    const payload = { chat_id: chatId, photo: photoUrl, caption: caption, parse_mode: 'MarkdownV2' };
    if (inlineKeyboard) payload.reply_markup = { inline_keyboard: inlineKeyboard };
    await telegramApiCall('sendPhoto', payload);
}

async function sendMessage(chatId, text, inlineKeyboard = null, autoEscape = true) {
    const processedText = autoEscape ? escapeMarkdown(text) : text;
    const payload = { chat_id: chatId, text: processedText, parse_mode: 'MarkdownV2' };
    if (inlineKeyboard) payload.reply_markup = { inline_keyboard: inlineKeyboard };
    return await telegramApiCall('sendMessage', payload);
}

async function createDNSRecord(name, zoneId) {
    const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`, {
        method: 'POST',
        headers: {
            'X-Auth-Email': CF_EMAIL,
            'X-Auth-Key': CF_API_KEY,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ type: 'CNAME', name, content: 'cf.aptic.ir', ttl: 1, proxied: false })
    });
    
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.errors?.[0]?.message || 'Cloudflare API failed');
    }
}   

async function sendReceiptToAdmin(userId, transactionId, planLabel, planPrice, randomKey, domain) {
    const now = new Date();
    const persianDate = new Intl.DateTimeFormat('fa-IR', { dateStyle: 'full', timeZone: 'Asia/Tehran' }).format(now);
    
    const linkText = randomKey ? randomKey : 'نامشخص';
    
    const currentDomain = domain || DOMAINS_LIST[0].domain;
    const safeDomain = currentDomain.replace(/\./g, '\\.');
    const safeLink = `https://link\\.${safeDomain}/${linkText}`;

    const receiptText = `✅ *خرید جدید ثبت شد*

▫️ آیدی کاربر: \`${userId}\`
▫️ لینک کاربر:
${safeLink} 
⚡️ نام سرویس: ${escapeMarkdown(planLabel)}
⏰ تاریخ خرید: ${escapeMarkdown(persianDate)}`;

    await sendMessage(ADMIN_ID, receiptText, null, false);
}

function generateRandomString(length) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
    return result;
}
