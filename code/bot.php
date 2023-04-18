<?php

$bot_token = '000000000000000000000000000000000000000000000000';

$update = json_decode(file_get_contents('php://input'), true);
$message = $update['message'];
$chat_id = $message['chat']['id'];

if (strpos($message['text'], '/start') === 0) {
   // $response = "Welcome to the Expreset bot";
    send_message($chat_id, $response);
    $response = "یک گزینه را انتخاب کنید";
    $reply_markup = array(
        "keyboard" => array(
            array(
                array("text" => "❎ مشاهده وضعیت اشتراک")
            )
        ),
        "resize_keyboard" => true
    );
    send_message($chat_id, $response, $reply_markup);
}

if ($message['text'] == "❎ مشاهده وضعیت اشتراک") {
    $user_id = $message['from']['id'];

    $file_url = "https://raw.githubusercontent.com/emdarx/expreset/main/user/list.txt";
    $file_content = file_get_contents($file_url);
    $user_list = explode("\n", $file_content);

    $user_uuid = "";
    foreach ($user_list as $user_info) {
        $user_info_arr = explode(",", $user_info);
        if ($user_info_arr[0] == $user_id) {
            $user_uuid = $user_info_arr[1];
            break;
        }
    }

    if ($user_uuid == "") {
        $response = "شما اشتراک فعالی ندارید.\n🪐 خرید اشتراک: @Support";
        send_message($chat_id, $response);
    }

    else {
        $api_url = "https://getafreenode.com/vendor/api.php?act=getuserinfo&uuid=".$user_uuid;
        $api_response = file_get_contents($api_url);
        $api_data = json_decode($api_response, true);

        $remaining_traffic = $api_data['remainingTraffic'];
        $uuid = substr($api_data['uuid'], 0, 8);

        $response = "ترافیک باقی مانده: ".$remaining_traffic."\n";
        $response .= "Account #".$uuid;
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
