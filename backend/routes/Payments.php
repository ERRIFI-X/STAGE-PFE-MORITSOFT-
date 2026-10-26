<?php
require_once __DIR__ . '/../controllers/Finance.php';

$financeController = new Finance();

header('Content-Type: application/json');
global $userData;

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $result = $financeController->getAllPayments($userData);
    echo json_encode($result);
} else if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true) ?? $_POST;
    $result = $financeController->recordPayment($data, $userData);
    if (!($result['success'] ?? false)) {
        http_response_code(400);
    }
    echo json_encode($result);
} else if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    if (isset($_GET['id'])) {
        $id = (int)$_GET['id'];
        $result = $financeController->deletePayment($id);
        if (!($result['success'] ?? false)) {
            http_response_code(400);
        }
        echo json_encode($result);
    } else {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'ID is required.']);
    }
} else if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    if (isset($_GET['id'])) {
        $data = json_decode(file_get_contents("php://input"), true);
        $result = $financeController->updatePayment((int)$_GET['id'], $data);
        if (!($result['success'] ?? false)) http_response_code(400);
        echo json_encode($result);
    } else {
        http_response_code(400);
        echo json_encode(['error' => 'ID is required for UPDATE']);
    }
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
}
