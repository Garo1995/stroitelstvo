<?php
/**
 * Приём заявок с сайта и отправка на почту.
 * Перед запуском замените TO_EMAIL и FROM_EMAIL на свои адреса.
 * FROM_EMAIL должен быть адресом вашего домена, иначе письма уйдут в спам.
 */

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

const TO_EMAIL   = 'info@example.ru';
const FROM_EMAIL = 'noreply@example.ru';
const SITE_NAME  = 'СтройДом';

function respond(int $code, bool $ok, string $error = ''): void
{
    http_response_code($code);
    echo json_encode(['ok' => $ok, 'error' => $error], JSON_UNESCAPED_UNICODE);
    exit;
}

function clean(string $value, int $limit): string
{
    $value = strip_tags($value);
    $value = preg_replace('/[\r\n\t]+/u', ' ', $value) ?? '';

    return mb_substr(trim($value), 0, $limit);
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    respond(405, false, 'Method not allowed');
}

// Скрытое поле-ловушка: человек его не видит, бот заполняет
if (!empty($_POST['website'])) {
    respond(200, true);
}

$name    = clean((string)($_POST['name'] ?? ''), 60);
$phone   = preg_replace('/\D+/', '', (string)($_POST['phone'] ?? '')) ?? '';
$service = clean((string)($_POST['service'] ?? 'Не указано'), 60);
$source  = clean((string)($_POST['source'] ?? ''), 30);

if (mb_strlen($name) < 2) {
    respond(422, false, 'Укажите имя');
}

if (!preg_match('/^7\d{10}$/', $phone)) {
    respond(422, false, 'Укажите телефон полностью');
}

if (empty($_POST['agree'])) {
    respond(422, false, 'Нужно согласие на обработку данных');
}

$subject = '=?UTF-8?B?' . base64_encode('Новая заявка с сайта ' . SITE_NAME) . '?=';

$body = implode("\n", [
    'Имя: ' . $name,
    'Телефон: +' . $phone,
    'Услуга: ' . $service,
    'Форма: ' . ($source !== '' ? $source : '—'),
    'Дата: ' . date('d.m.Y H:i'),
    'IP: ' . ($_SERVER['REMOTE_ADDR'] ?? '—'),
]);

$headers = [
    'From'         => FROM_EMAIL,
    'MIME-Version' => '1.0',
    'Content-Type' => 'text/plain; charset=UTF-8',
];

if (!mail(TO_EMAIL, $subject, $body, $headers)) {
    respond(500, false, 'Не удалось отправить письмо');
}

respond(200, true);
