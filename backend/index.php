<?php
require_once __DIR__ . '/vendor/autoload.php';
require_once __DIR__ . '/controllers/Middleware.php';

// Global Exception Handler to ensure consistent JSON responses
set_exception_handler(function ($e) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
    exit;
});

// Global Error Handler for fatal PHP errors
set_error_handler(function ($severity, $message, $file, $line) {
    if (!(error_reporting() & $severity)) {
        return false;
    }
    if (in_array($severity, [E_ERROR, E_CORE_ERROR, E_COMPILE_ERROR, E_USER_ERROR])) {
        throw new ErrorException($message, 0, $severity, $file, $line);
    }
    return false;
});

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header('Content-Type: application/json');

// Handle preflight requests for CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// 1. Resolve Route: Support both ?page=... (query) and /path (RESTful / CLI server)
$page = $_GET['page'] ?? '';
if (empty($page)) {
    $requestUri = parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH);
    $scriptName = $_SERVER['SCRIPT_NAME'] ?? '';
    $scriptDir  = str_replace('\\', '/', dirname($scriptName));
    
    if ($scriptDir !== '/' && strpos($requestUri, $scriptDir) === 0) {
        $requestUri = substr($requestUri, strlen($scriptDir));
    }
    $path = trim($requestUri, '/');
    $segments = explode('/', $path);
    if (!empty($segments) && ($segments[0] === 'index.php' || $segments[0] === 'api')) {
        array_shift($segments);
    }
    $page = !empty($segments) ? $segments[0] : '';
}

// 2. Unprotected / Public Routes
if (in_array($page, ['database', 'migrate', 'create'])) {
    require_once __DIR__ . '/models/migration.php';
    $jsonResult = createTables();
    $isJson = (php_sapi_name() === 'cli') || (isset($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false);
    
    if ($isJson) {
        header('Content-Type: application/json');
        echo $jsonResult;
    } else {
        header('Content-Type: text/html; charset=UTF-8');
        global $status;
        echo renderCreationHtml($status ?? json_decode($jsonResult, true));
    }
    exit;
}

if (in_array($page, ['factory', 'seed', 'seeder'])) {
    require_once __DIR__ . '/models/Factory.php';
    $res = runFactory(true);
    $isJson = (php_sapi_name() === 'cli') || (isset($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false);

    if ($isJson) {
        header('Content-Type: application/json');
        echo json_encode($res, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    } else {
        header('Content-Type: text/html; charset=UTF-8');
        echo renderFactoryHtml($res);
    }
    exit;
}

if ($page === 'auth') {
    require_once __DIR__ . '/routes/Auth.php';
    exit;
}

// 3. Protected Routes (Require JWT)
$userData = Middleware::authenticate();

switch ($page) {
    case 'clients':
        require_once __DIR__ . '/routes/Clients.php';
        break;
    case 'projects':
        require_once __DIR__ . '/routes/Project.php';
        break;
    case 'tasks':
        require_once __DIR__ . '/routes/Tasks.php';
        break;
    case 'subtasks':
        require_once __DIR__ . '/routes/Subtasks.php';
        break;
    case 'dashboard':
        require_once __DIR__ . '/routes/Dashboard.php';
        break;
    case 'payments':
        require_once __DIR__ . '/routes/Payments.php';
        break;
    case 'invoices':
        require_once __DIR__ . '/routes/invoices.php';
        break;
    case 'notifications':
        require_once __DIR__ . '/routes/Notifications.php';
        break;
    case 'services':
        require_once __DIR__ . '/routes/Services.php';
        break;
    case 'system':
        require_once __DIR__ . '/routes/System.php';
        break;
    default:
        echo json_encode([
            'success' => true,
            'message' => 'Project Management API',
            'user' => $userData['username'] ?? 'Anonymous'
        ]);
        break;
}

