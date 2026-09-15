<?php

declare(strict_types=1);  // — включает строгую типизацию для этого конкретного файла. Без неё PHP по умолчанию сам приводит типы (например, строку "5" молча превратит в число 5 при сравнении).


//  Настройка обработки ошибок

error_reporting(E_ALL);  // — просим PHP отслеживать все уровни ошибок, включая notice и warning, а не только фатальные. Это не значит, что они будут показаны пользователю — это отдельная настройка ниже.
ini_set('display_errors', '0'); // — критически важная строка для продакшна. Она запрещает PHP выводить текст ошибок прямо в HTTP-ответ.
ini_set('log_errors', '1'); // — включает запись ошибок в лог-файл вместо (или вместе с) вывода в браузер. Раз мы прячем ошибки от пользователя, нужно, чтобы они не терялись полностью — иначе вы не узнаете, что что-то сломалось.
ini_set('error_log', __DIR__ . '/logs/php_errors.log'); // — указывает, куда именно писать лог. __DIR__ — магическая константа PHP, всегда равна абсолютному пути к папке, где лежит текущий файл (то есть .../public/php/). Используем её вместо относительного пути 'logs/php_errors.log', потому что относительный путь зависит от того, откуда скрипт был запущен (рабочей директории процесса), а она не всегда совпадает с папкой скрипта — особенно на разных хостингах это ведёт к «файл не найден» без явной причины.

// --- Подключаем PHPMailer вручную, без composer ---
require_once __DIR__ . '/phpmailer/Exception.php';
require_once __DIR__ . '/phpmailer/PHPMailer.php';
require_once __DIR__ . '/phpmailer/SMTP.php';


use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception as PHPMailerException;

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff'); // — заголовок безопасности. Запрещает браузеру самому "угадывать" тип содержимого (MIME sniffing) и интерпретировать ответ иначе, чем указано в Content-Type. Без этого заголовка теоретически возможна атака, когда браузер решает, что JSON-ответ на самом деле HTML/JS, и исполняет его — актуально, если бы, например, в тело ответа как-то попал пользовательский ввод без экранирования.

// Функция-хелпер для унифицированных ответов
function respond(int $code, array $body): void {  // Вынесена в отдельную функцию, чтобы не дублировать одинаковый паттерн "поставить код ответа + вывести JSON + остановить скрипт" в десятке мест ниже — это и короче, и снижает риск, что где-то забудешь exit и код продолжит выполняться после отправки ответа.
    http_response_code($code);
    echo json_encode($body, JSON_UNESCAPED_UNICODE);
    exit;
}

// Проверка HTTP-метода
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(405, ['success' => false, 'message' => 'Метод не разрешён']);
}

// --- Тело запроса: поддерживаем и JSON, и обычный form-data (на случай <form method="post"> без JS) ---
$contentType = $_SERVER['CONTENT_TYPE'] ?? '';
if (str_contains($contentType, 'application/json')) {
    $raw = file_get_contents('php://input');
    $input = json_decode($raw, true);
    if (!is_array($input)) {
        respond(400, ['success' => false, 'message' => 'Некорректный формат данных']);
    }
} else {
    $input = $_POST;
}


// --- Honeypot ---
if (!empty($input['website'])) {
    respond(200, ['success' => true]);
}

// --- Санитизация ---
function sanitize(string $value): string {
    $value = trim($value);
    $value = strip_tags($value);
    $value = preg_replace('/[\x00-\x1F\x7F]/u', '', $value);
    return $value ?? '';
}

$name    = sanitize((string)($input['name'] ?? ''));
$phone   = sanitize((string)($input['phone'] ?? ''));
$email   = sanitize((string)($input['email'] ?? ''));
$message = sanitize((string)($input['message'] ?? ''));

// --- Серверная валидация ---
$errors = [];

if ($name === '' || mb_strlen($name) < 2) {
    $errors['name'] = 'Введите корректное имя (минимум 2 символа)';
} elseif (mb_strlen($name) > 100) {
    $errors['name'] = 'Имя слишком длинное';
} elseif (!preg_match('/^[a-zA-Zа-яА-ЯёЁ\s\-]+$/u', $name)) {
    $errors['name'] = 'Имя содержит недопустимые символы';
}

$phoneDigits = preg_replace('/\D/', '', $phone);
if ($phone === '') {
    $errors['phone'] = 'Введите телефон';
} elseif (strlen($phoneDigits) < 10 || strlen($phoneDigits) > 15) {
    $errors['phone'] = 'Некорректный номер телефона';
} elseif (!preg_match('/^[+()\d\s\-]+$/', $phone)) {
    $errors['phone'] = 'Телефон содержит недопустимые символы';
}

if ($email === '') {
    $errors['email'] = 'Введите email';
} elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors['email'] = 'Некорректный email';
} elseif (mb_strlen($email) > 150) {
    $errors['email'] = 'Email слишком длинный';
}

if ($message === '') {
    $errors['message'] = 'Введите сообщение';
} elseif (mb_strlen($message) < 10) {
    $errors['message'] = 'Сообщение слишком короткое';
} elseif (mb_strlen($message) > 2000) {
    $errors['message'] = 'Сообщение слишком длинное';
}

if (!empty($errors)) {
    respond(422, ['success' => false, 'message' => 'Проверьте правильность заполнения формы', 'errors' => $errors]);
}


// --- Отправка письма ---
$mail = new PHPMailer(true);


try {
  //  На некоторых устаревших тарифных планах GoDaddy блокирует внешние SMTP-порты (465/587). В этом случае используйте внутренний сервер ретрансляции GoDaddy без авторизации:
  $mail->isSMTP();
  $mail->Host = 'localhost'; // Или 'relay-hosting.secureserver.net'
  $mail->SMTPAuth = false;       // Авторизация не требуется
  $mail->SMTPSecure = false;       // Без SSL/TLS
  $mail->SMTPAutoTLS = false;
  $mail->Port = 25;          // Внутренний порт GoDaddy

  $mail->setFrom('info@ynanchyzmat.com', 'Заявка с сайта');
  $mail->addAddress('info@ynanchyzmat.com');
  $mail->addReplyTo($email, $name);

  $mail->isHTML(true);
  $mail->Subject = 'Новая заявка с сайта от ' . $name;

  $safeName    = htmlspecialchars($name, ENT_QUOTES, 'UTF-8'); // htmlspecialchars() — превращает спецсимволы HTML (<, >, ", ', &) в их безопасные HTML-эквиваленты (&lt;, &gt; и т.д.)
  $safePhone   = htmlspecialchars($phone, ENT_QUOTES, 'UTF-8');
  $safeEmail   = htmlspecialchars($email, ENT_QUOTES, 'UTF-8');
  $safeMessage = nl2br(htmlspecialchars($message, ENT_QUOTES, 'UTF-8')); // nl2br() — применяется только к $message, так как это единственное многострочное поле (textarea). Функция превращает реальные переносы строк (\n) в HTML-тег <br>, чтобы форматирование сообщения пользователя сохранилось при просмотре письма в HTML-виде (иначе весь текст сообщения "слипся" бы в одну строку визуально).

  $mail->Body = <<<HTML
        <h2>Новая заявка с формы обратной связи</h2>
        <p><strong>Имя:</strong> {$safeName}</p>
        <p><strong>Телефон:</strong> {$safePhone}</p>
        <p><strong>Email:</strong> {$safeEmail}</p>
        <p><strong>Сообщение:</strong><br>{$safeMessage}</p>
    HTML;

  $mail->AltBody = "Имя: $name\nТелефон: $phone\nEmail: $email\n\n$message";

  // Отправка
    $mail->send();

  respond(200, ['success' => true, 'message' => 'Сообщение успешно отправлено']);

} catch (PHPMailerException $e) {
    error_log('PHPMailer error: ' . $mail->ErrorInfo);
    respond(500, ['success' => false, 'message' => 'Не удалось отправить сообщение. Попробуйте позже.']);
} catch (\Throwable $e) {
    error_log('Unexpected error: ' . $e->getMessage());
    respond(500, ['success' => false, 'message' => 'Произошла непредвиденная ошибка.']);
}