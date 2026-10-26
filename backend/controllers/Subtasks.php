<?php

require_once __DIR__ . '/../models/Sql.php';

class Subtasks
{
    private $sql;

    public function __construct()
    {
        $this->sql = new Sql();
    }

    public function getAll($task_id = null)
    {
        if ($task_id) {
            return $this->sql->getAll(
                "SELECT * FROM subtasks WHERE task_id = :task_id ORDER BY created_at ASC",
                [':task_id' => (int)$task_id]
            );
        }
        return $this->sql->getAll("SELECT * FROM subtasks ORDER BY created_at ASC");
    }

    public function create($data)
    {
        $id = $this->sql->create(
            "INSERT INTO subtasks (task_id, title, description, status, priority) 
             VALUES (:task_id, :title, :description, :status, :priority)",
            [
                ':task_id'     => (int)$data['task_id'],
                ':title'       => htmlspecialchars($data['title']),
                ':description' => htmlspecialchars($data['description'] ?? ''),
                ':status'      => $data['status'] ?? 'todo',
                ':priority'    => $data['priority'] ?? 'medium'
            ]
        );
        return ['success' => (bool)$id, 'id' => $id];
    }

    public function update($id, $data)
    {
        $result = $this->sql->update(
            "UPDATE subtasks SET 
                title = :title, 
                description = :description, 
                status = :status, 
                priority = :priority 
            WHERE id = :id",
            [
                ':id'          => $id,
                ':title'       => htmlspecialchars($data['title']),
                ':description' => htmlspecialchars($data['description'] ?? ''),
                ':status'      => $data['status'] ?? 'todo',
                ':priority'    => $data['priority'] ?? 'medium'
            ]
        );
        return ['success' => $result];
    }

    public function delete($id)
    {
        return ['success' => $this->sql->delete("DELETE FROM subtasks WHERE id = :id", [':id' => $id])];
    }

    public function updateStatus($id, $status)
    {
        $result = $this->sql->update(
            "UPDATE subtasks SET status = :status WHERE id = :id",
            [
                ':id' => $id,
                ':status' => $status
            ]
        );
        return ['success' => $result];
    }
}
