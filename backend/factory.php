<?php
/**
 * Kalyo OS - Script direct de peuplement de données (Factory / Seeder)
 * URL: http://localhost/STAGE%20PFE/backend/factory.php
 */
require_once __DIR__ . '/vendor/autoload.php';
require_once __DIR__ . '/models/Factory.php';

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");

$res = runFactory(true);
$isJson = (php_sapi_name() === 'cli') || (isset($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false) || (isset($_GET['format']) && $_GET['format'] === 'json');

if ($isJson) {
    header('Content-Type: application/json; charset=UTF-8');
    echo json_encode($res, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
} else {
    header('Content-Type: text/html; charset=UTF-8');
    echo renderFactoryHtml($res);
}
