<?php

$bot_token = '10101010101010101010101010101010101010101010101010101010';
$file_url = "https://raw.githubusercontent.com/emdarx/expreset/main/user/list.txt";
$update = json_decode(file_get_contents('php://input'), true);
$message = $update['message'];
$chat_id = $message['chat']['id'];

if (strpos($message['text'], '/start') === 0) {
    $response = "به ربات Expreset خوش آمدید\nیک گزینه را انتخاب کنید:";
	$reply_markup = array(
    "keyboard" => array(
        array(
            array("text" => "🔁 تمدید اشتراک"),
            array("text" => "🛒 خرید اشتراک")
        ),
        array(
            array("text" => "❎ وضعیت اشتراک"),
			array("text" => "📖 راهنمای اتصال")
        )
    ),
    "resize_keyboard" => true
);

    send_message($chat_id, $response, $reply_markup);
}

if ($message['text'] == "📖 راهنمای اتصال") {
    $response = "راهنمای استفاده از سرویس ها:

با توجه به اختلالات گسترده در اینترنت کشور و استفاده از سیستم فیلترینگ چینی GFW، و قدیمی بودن هسته xray کلاینت هایی مثل Napsternetv و امکان لو رفتن اطلاعات و فیلتر سرور، بهتر از طبق آموزش های ما از کلاینت های بروز مخصوص هر دستگاه استفاده کنید.

پس از دریافت اشتراک خود بصورت کد یا QR CODE آن را در برنامه مخصوص گوشی یا کامپیوتر خود وارد نمایید.


🗳 برنامه iOS 16 به بالا
Wings X t.ly/XXM6
🗳 برنامه iOS 14 به بالا
V2BOX t.ly/Zlz-
🗳 برنامه iOS 12 به بالا
Fair VPN t.ly/EO4i

🗳 برنامه های اندروید
V2RAYNG t.ly/-gsl
MATSURI t.ly/JWOR
NapsternetV t.ly/hcWQK

🗳 برنامه های ویندوز
V2RAYN t.ly/PMtg
nekoray t.ly/WVbY


";
    send_message($chat_id, $response);
}

if ($message['text'] == "🛒 خرید اشتراک") {
//  $text = "💮 سفارش اشتراک Expreset\n\nاشتراک 10 گیگابایت\nلینک خرید: exp10gb.ir.page\n\nشناسه عددی خود را از @USERINFOBOT دریافت کنید و در هنگام پرداخت در کادر مربوطه وارد نمایید.";
	$text = "⛔️ سفارش اشتراک جدید امکان پذیر نیست";
    $parameters = array(
        'chat_id' => $message['chat']['id'],
        'text' => $text
    );
    $url = "https://api.telegram.org/bot" . $bot_token . "/sendMessage?" . http_build_query($parameters);
    file_get_contents($url);
}

if ($message['text'] == "🔁 تمدید اشتراک") {
    $user_id = $message['from']['id'];
    $file_content = file_get_contents($file_url);
    $user_list = explode("\n", $file_content);

    $user_info_arr = null;
    foreach ($user_list as $user_info) {
        $user_info_arr = explode(",", $user_info);
        if ($user_info_arr[0] == $user_id) {
            break;
        }
        $user_info_arr = null;
    }

    if (is_null($user_info_arr)) {
        $response = "⚠️ شما اشتراک فعالی برای تمدید ندارید";
    } else {
        $uuid = $user_info_arr[1];
        $api_url = "https://getafreenode.com/vendor/api.php?act=getuserinfo&uuid=".$uuid;
        $api_response = file_get_contents($api_url);
        $api_data = json_decode($api_response, true);

        $remaining_traffic = $api_data['remainingTraffic'];
        if ($remaining_traffic < 3) {
	    	$response = "🚀 تمدید اشتراک:\n\nبرای تمدید حجم اشتراک #".$uuid." به میزان دلخواه، ابتدا از درگاه نسبت به پرداخت هزینه تمدید اقدام کنید. توجه کنید حتما در توضیحات پرداخت کد UUID اشتراک خود را وارد کنید. اشتراک شما پس از پرداخت بصورت خودکار شارژ و مجددا فعال می‌گردد.\n\n🛍 پرداخت آنلاین: RAHPO.IR.PAGE";
        } else {
            $response = "⚠️ در حال حاضر تمدید اشتراک بالای 3GB ممکن نیست";
        }
    }
    send_message($chat_id, $response);
}
	if ($message['text'] == "❎ وضعیت اشتراک") {
		$user_id = $message['from']['id'];
		$file_content = file_get_contents($file_url);
		$user_list = explode("\n", $file_content);

    $user_uuids = array();
    foreach ($user_list as $user_info) {
			$user_info_arr = explode(",", $user_info);
        if ($user_info_arr[0] == $user_id) {
            $user_uuids[] = $user_info_arr[1];
        }
    }

    if (count($user_uuids) == 0) {
		$response = "⚠️ شما اشتراک فعالی ندارید";
        send_message($chat_id, $response);
    }
    else {
        $response = "📊 وضعیت اشتراک ها:\n\n";
        foreach ($user_uuids as $user_uuid) {
            $api_url = "https://getafreenode.com/vendor/api.php?act=getuserinfo&uuid=".$user_uuid;
            $api_response = file_get_contents($api_url);
            $api_data = json_decode($api_response, true);

            $remaining_traffic = $api_data['remainingTraffic'];
            $uuid = substr($api_data['uuid'], 0, 8);

            if ($remaining_traffic <= 0.00) {
                $response .= "اشتراک #".$uuid."\n";
                $response .= "⚠️ حجم اشتراک به پایان رسیده است\n";
            }
            else {
                $response .= "اشتراک #".$uuid."\n";
                $response .= "حجم باقی مانده: ".number_format($remaining_traffic, 2)." گیگ\n";
                $response .= "وضعیت: فعال ✅\n\n";
            }
        }
        send_message($chat_id, $response);
    }
}

	function send_message($chat_id, $message, $reply_markup = null) {
    global $bot_token;
    $url = "https://api.telegram.org/bot".$bot_token."/sendMessage?chat_id=".$chat_id."&text=".urlencode($message);
    if ($reply_markup !== null) {
        $url .= "&reply_markup=".json_encode($reply_markup);
    }
    file_get_contents($url);
}
