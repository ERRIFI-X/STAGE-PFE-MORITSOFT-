<?php
require_once __DIR__ . '/../controllers/Notifications.php';

$controller = new NotificationsController();

header('Content-Type: application/json');

global $userData;
$currentUserId = (int)($userData['id'] ?? ($_GET['user_id'] ?? 0));
$currentUserRole = $userData['role'] ?? ($_GET['role'] ?? 'client');

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (empty($currentUserId)) {
        echo json_encode([]);
        exit;
    }

    if (isset($_GET['count'])) {
        echo json_encode($controller->getUnreadCount($currentUserId, $currentUserRole));
    } else {
        echo json_encode($controller->getByUser($currentUserId, $currentUserRole));
    }
} else if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true) ?? $_POST;
    if (empty($data['user_role']) && !empty($currentUserRole)) {
        $data['user_role'] = $currentUserRole;
    }
    $result = $controller->create($data);
    if (!$result['success']) http_response_code(400);
    echo json_encode($result);
} else if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    if (isset($_GET['id'])) {
        $result = $controller->markAsRead((int)$_GET['id'], $currentUserId, $currentUserRole);
        echo json_encode($result);
    } else if (isset($_GET['mark_all'])) {
        $result = $controller->markAllAsRead($currentUserId, $currentUserRole);
        echo json_encode($result);
    } else {
        http_response_code(400);
        echo json_encode(['error' => 'ID or mark_all is required']);
    }
} else if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    if (isset($_GET['all'])) {
        $result = $controller->deleteAll($currentUserId, $currentUserRole);
        echo json_encode($result);
    } else if (isset($_GET['id'])) {
        $result = $controller->delete((int)$_GET['id'], $currentUserId, $currentUserRole);
        echo json_encode($result);
    } else {
        http_response_code(400);
        echo json_encode(['error' => 'ID is required']);
    }
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
}
