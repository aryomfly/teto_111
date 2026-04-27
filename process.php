<?php
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $name = htmlspecialchars($_POST['user_name']);
    $email = htmlspecialchars($_POST['user_email']);
    $city = htmlspecialchars($_POST['city']);
    $seat_type = htmlspecialchars($_POST['seat_type']);
    $qty = intval($_POST['quantity']);
    
    if (!function_exists('curl_init')) {
        echo "<p>Ошибка сервера: расширение PHP cURL не включено. Установите cURL или используйте PHP-хостинг.</p>";
        exit;
    }

    // Расчет цены
    $price = 500;
    if ($seat_type == "Balcony") $price = 300;
    if ($seat_type == "FanZone") $price = 800;
    if ($seat_type == "VIP") $price = 1500;
    $total = $qty * $price;

    // Настройки Telegram
    $botToken = '8778150621:AAFEU48xcdFgbScjZdGQmW4_raLAN0NKNvs';
    $chatId = '1691344016';

    $message = "Новое бронирование:\n"
        . "Имя: <b>" . htmlspecialchars($name) . "</b>\n"
        . "Город: <b>" . htmlspecialchars($city) . "</b>\n"
        . "Место: <b>" . htmlspecialchars($seat_type) . "</b>\n"
        . "Количество: <b>" . $qty . "</b>\n"
        . "Итого: <b>" . $total . " G</b>\n"
        . "Почта: <b>" . htmlspecialchars($email) . "</b>\n";

    $telegramUrl = "https://api.telegram.org/bot{$botToken}/sendMessage";
    $postFields = [
        'chat_id' => $chatId,
        'text' => $message,
        'parse_mode' => 'HTML'
    ];

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $telegramUrl);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $postFields);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    $result = curl_exec($ch);
    $curlError = curl_error($ch);
    curl_close($ch);

    $response = json_decode($result, true);
    if ($response && isset($response['ok']) && $response['ok'] === true) {
        $msg = "Заявка отправлена в Telegram!";
    } else {
        $errorText = $response['description'] ?? $curlError ?: 'Неизвестная ошибка';
        $msg = "ОШИБКА: Не удалось отправить в Telegram. {$errorText}";
    }

    // Выводим визуальный билет и статус отправки
    echo "
    <!DOCTYPE html>
    <html lang='ru'>
    <head>
        <meta charset='UTF-8'>
        <link rel='stylesheet' href='style.css'>
        <style>
            body { display:flex; justify-content:center; align-items:center; min-height:100vh; background:#000; flex-direction:column; color:#fff; }
            .ticket { border:4px solid #fff; padding:20px; width:400px; background:#000; }
            .status { color:#00ff00; margin-bottom:20px; font-weight:bold; }
        </style>
    </head>
    <body>
        <div class='status'>$msg</div>
        <div class='ticket'>
            <h2 style='color:#ffcc00;'>❤ CONCERT TICKET</h2>
            <p>NAME: " . strtoupper($name) . "</p>
            <p>CITY: $city</p>
            <p>SEAT: $seat_type</p>
            <p>TOTAL: $total G</p>
        </div>
        <br>
        <a href='index.php' class='btn-pixel'>ВЕРНУТЬСЯ</a>
    </body>
    </html>";
}