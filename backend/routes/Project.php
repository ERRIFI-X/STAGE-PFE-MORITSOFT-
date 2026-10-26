<?php

require_once __DIR__ . '/../controllers/Project.php';

$projectController = new Project();

header('Content-Type: application/json');
global $userData;

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (isset($_GET['id'])) {
        $id = (int)$_GET['id'];
        $result = $projectController->show($id, $userData);
        
        if (!$result) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Projet introuvable ou accès non autorisé.']);
            exit;
        }
        
        echo json_encode($result);
    } else {
        $clientId = ($userData['role'] === 'client') ? $userData['id'] : ($_GET['client_id'] ?? null);
        $result = $projectController->getAll($clientId, $userData);
        echo json_encode($result);
    }
} else if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true) ?? $_POST;
    if ($userData['role'] === 'client') {
        $data['client_id'] = $userData['id'];
        $data['status'] = 'pending';
    }
    $result = $projectController->store($data, $userData);
    if (!($result['success'] ?? false)) {
        http_response_code(400);
    }
    echo json_encode($result);
} else if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $data = json_decode(file_get_contents("php://input"), true);
    if (isset($_GET['confirm']) && isset($_GET['id'])) {
        $id = (int)$_GET['id'];
        $result = $projectController->confirmProject($id, $userData['id']);
        if (!($result['success'] ?? false)) {
            http_response_code(400);
        }
        echo json_encode($result);
    } elseif (isset($_GET['reject']) && isset($_GET['id'])) {
        $id = (int)$_GET['id'];
        $result = $projectController->rejectProject($id, $userData['id'], $data);
        if (!($result['success'] ?? false)) {
            http_response_code(400);
        }
        echo json_encode($result);
    } elseif (isset($_GET['resend']) && isset($_GET['id'])) {
        $id = (int)$_GET['id'];
        $result = $projectController->resendOffer($id);
        if (!($result['success'] ?? false)) {
            http_response_code(400);
        }
        echo json_encode($result);
    } elseif (isset($_GET['id'])) {
        $id = (int)$_GET['id'];
        $result = $projectController->update($id, $data);
        if (!($result['success'] ?? false)) {
            http_response_code(400);
        }
        echo json_encode($result);
    } else {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'ID is required for update.']);
    }
} else if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    if (isset($_GET['id'])) {
        $id = (int)$_GET['id'];
        $result = $projectController->delete($id);
        if (!($result['success'] ?? false)) {
            http_response_code(400);
        }
        echo json_encode($result);
    } else {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'ID is required for delete.']);
    }
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
}
