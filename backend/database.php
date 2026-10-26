<?php
/**
 * Kalyo OS - Script direct d'initialisation de la base de données
 * URL: http://localhost/STAGE%20PFE/backend/database.php
 */
require_once __DIR__ . '/vendor/autoload.php';
require_once __DIR__ . '/models/migration.php';

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");

$jsonResult = createTables();
$isJson = (php_sapi_name() === 'cli') || (isset($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false) || (isset($_GET['format']) && $_GET['format'] === 'json');

if ($isJson) {
    header('Content-Type: application/json; charset=UTF-8');
    echo $jsonResult;
} else {
    header('Content-Type: text/html; charset=UTF-8');
    global $status;
    echo renderCreationHtml($status ?? json_decode($jsonResult, true));
}
