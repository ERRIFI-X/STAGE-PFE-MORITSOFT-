<?php

require_once __DIR__ . '/../controllers/Subtasks.php';

$subtasksController = new Subtasks();

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $task_id = isset($_GET['task_id']) ? (int)$_GET['task_id'] : null;
    $result = $subtasksController->getAll($task_id);
    echo json_encode(['success' => true, 'data' => $result]);
} else if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true) ?? $_POST;
    $result = $subtasksController->create($data);
    if (!$result['success']) {
        http_response_code(400);
    }
    echo json_encode($result);
} else if ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    $data = json_decode(file_get_contents("php://input"), true);
    if (isset($_GET['id'])) {
        $id = (int)$_GET['id'];
        if (isset($data['status']) && count($data) === 1) {
            // Only update status
            $result = $subtasksController->updateStatus($id, $data['status']);
        } else {
            // Update full subtask
            $result = $subtasksController->update($id, $data);
        }
        if (!$result['success']) {
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
        $result = $subtasksController->delete($id);
        if (!$result['success']) {
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
