<?php

require_once __DIR__ . '/../models/Sql.php';

class ActivityLog
{
    private $sql;

    public function __construct()
    {
        $this->sql = new Sql();
    }

    /**
     * Records a new activity in the database.
     */
    public function log($userId, $action, $entityType, $entityId, $oldValue = null, $newValue = null)
    {
        return $this->sql->create(
            "INSERT INTO activity_logs (user_id, action, entity_type, entity_id, old_value, new_value, ip_address) 
             VALUES (:user_id, :action, :entity_type, :entity_id, :old_value, :new_value, :ip_address)",
            [
                ':user_id'     => $userId,
                ':action'      => $action,
                ':entity_type' => $entityType,
                ':entity_id'   => $entityId,
                ':old_value'   => $oldValue ? json_encode($oldValue) : null,
                ':new_value'   => $newValue ? json_encode($newValue) : null,
                ':ip_address'  => $_SERVER['REMOTE_ADDR'] ?? null
            ]
        );
    }

    /**
     * Fetches all logs, optionally filtered by entity.
     */
    public function getAll($entityType = null, $entityId = null)
    {
        $query = "SELECT a.*, admin.username as user_name 
                  FROM activity_logs a 
                  LEFT JOIN admin ON a.user_id = admin.id";
        $params = [];

        if ($entityType && $entityId) {
            $query .= " WHERE a.entity_type = :type AND a.entity_id = :id";
            $params = [':type' => $entityType, ':id' => $entityId];
        }

        $query .= " ORDER BY a.created_at DESC LIMIT 100";
        return $this->sql->getAll($query, $params);
    }
}
