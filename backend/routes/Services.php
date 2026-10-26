<?php

require_once __DIR__ . '/../models/Sql.php';

$sql = new Sql();

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Return all services — optionally filtered by project_id
    if (isset($_GET['project_id'])) {
        $services = $sql->getAll(
            "SELECT * FROM services WHERE project_id = :project_id ORDER BY name ASC",
            [':project_id' => (int)$_GET['project_id']]
        );
    } else {
        // Return unique services as a catalog for the wizard
        $services = $sql->getAll("
            SELECT MIN(id) as id, name, MAX(price) as price, MAX(duration_days) as duration_days, MAX(description) as description 
            FROM services 
            GROUP BY name 
            ORDER BY name ASC
        ");
    }
    echo json_encode(['success' => true, 'data' => $services]);

} elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true) ?? $_POST;

    if (empty($data['project_id']) || empty($data['name'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'project_id and name are required']);
        exit;
    }

    $id = $sql->create(
        "INSERT INTO services (project_id, name, price, duration_days, description, status) VALUES (:project_id, :name, :price, :duration_days, :description, 'pending')",
        [
            ':project_id'    => (int)$data['project_id'],
            ':name'          => htmlspecialchars($data['name']),
            ':price'         => (float)($data['price'] ?? 0),
            ':duration_days' => (int)($data['duration_days'] ?? 0),
            ':description'   => htmlspecialchars($data['description'] ?? ''),
        ]
    );

    echo json_encode(['success' => (bool)$id, 'id' => $id]);

} elseif ($_SERVER['REQUEST_METHOD'] === 'PUT') {
    if (!isset($_GET['id'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'ID is required for update']);
        exit;
    }
    $data = json_decode(file_get_contents("php://input"), true);

    $result = $sql->update(
        "UPDATE services SET name = :name, price = :price, duration_days = :duration_days WHERE id = :id",
        [
            ':id'            => (int)$_GET['id'],
            ':name'          => htmlspecialchars($data['name'] ?? ''),
            ':price'         => (float)($data['price'] ?? 0),
            ':duration_days' => (int)($data['duration_days'] ?? 0),
        ]
    );
    echo json_encode(['success' => $result]);

} elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    if (!isset($_GET['id'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'ID is required for delete']);
        exit;
    }
    $result = $sql->delete("DELETE FROM services WHERE id = :id", [':id' => (int)$_GET['id']]);
    echo json_encode(['success' => $result]);

} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
}
