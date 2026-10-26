<?php
require_once __DIR__ . '/../controllers/Finance.php';

$financeController = new Finance();

header('Content-Type: application/json');
global $userData;

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (isset($_GET['id'])) {
        $id = (int)$_GET['id'];
        $result = $financeController->getInvoice($id, $userData);
        
        if (!$result) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Facture introuvable ou accès non autorisé.']);
            exit;
        }
        
        echo json_encode($result);
    } else {
        $clientId = ($userData['role'] === 'client') ? $userData['id'] : ($_GET['client_id'] ?? null);
        $result = $financeController->getAllInvoices($clientId, $userData);
        echo json_encode($result);
    }
} else if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true) ?? $_POST;
    $result = $financeController->createInvoice($data, $userData);
    if (!($result['success'] ?? false)) {
        http_response_code(400);
    }
    echo json_encode($result);
} else if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    if (isset($_GET['id'])) {
        $data = json_decode(file_get_contents("php://input"), true);
        $result = $financeController->updateInvoice((int)$_GET['id'], $data);
        if (!($result['success'] ?? false)) http_response_code(400);
        echo json_encode($result);
    } else {
        http_response_code(400);
        echo json_encode(['error' => 'ID is required for UPDATE']);
    }
} else if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    if (isset($_GET['id'])) {
        $result = $financeController->deleteInvoice((int)$_GET['id']);
        if (!($result['success'] ?? false)) http_response_code(400);
        echo json_encode($result);
    } else {
        http_response_code(400);
        echo json_encode(['error' => 'ID is required for DELETE']);
    }
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
}
