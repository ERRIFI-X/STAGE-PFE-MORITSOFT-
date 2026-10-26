<?php

require_once __DIR__ . '/../models/Sql.php';

class NotificationsController
{
    private $sql;

    public function __construct()
    {
        $this->sql = new Sql();
    }

    public function getAll()
    {
        return $this->sql->getAll("SELECT * FROM notifications ORDER BY created_at DESC");
    }

    /**
     * Get notifications targeted strictly to a specific user ID and user role (admin vs client)
     */
    public function getByUser($userId, $userRole = 'client')
    {
        $role = ($userRole === 'admin') ? 'admin' : 'client';
        return $this->sql->getAll(
            "SELECT * FROM notifications 
             WHERE user_id = :user_id AND user_role = :user_role 
             ORDER BY created_at DESC 
             LIMIT 50",
            [
                ':user_id'   => (int)$userId,
                ':user_role' => $role
            ]
        );
    }

    public function create($data)
    {
        $userRole = ($data['user_role'] ?? 'client') === 'admin' ? 'admin' : 'client';
        $id = $this->sql->create(
            "INSERT INTO notifications (user_id, user_role, type, message) 
             VALUES (:user_id, :user_role, :type, :message)",
            [
                ':user_id'   => (int)$data['user_id'],
                ':user_role' => $userRole,
                ':type'      => $data['type'] ?? 'info',
                ':message'   => htmlspecialchars($data['message'] ?? '')
            ]
        );
        return ['success' => (bool)$id, 'id' => $id];
    }

    public function markAsRead($id, $userId = null, $userRole = null)
    {
        if ($userId !== null && $userRole !== null) {
            $role = ($userRole === 'admin') ? 'admin' : 'client';
            $result = $this->sql->update(
                "UPDATE notifications SET is_read = TRUE WHERE id = :id AND user_id = :user_id AND user_role = :user_role",
                [':id' => (int)$id, ':user_id' => (int)$userId, ':user_role' => $role]
            );
        } else {
            $result = $this->sql->update(
                "UPDATE notifications SET is_read = TRUE WHERE id = :id",
                [':id' => (int)$id]
            );
        }
        return ['success' => $result];
    }

    public function markAllAsRead($userId, $userRole = 'client')
    {
        $role = ($userRole === 'admin') ? 'admin' : 'client';
        $result = $this->sql->update(
            "UPDATE notifications SET is_read = TRUE WHERE user_id = :user_id AND user_role = :user_role AND is_read = FALSE",
            [':user_id' => (int)$userId, ':user_role' => $role]
        );
        return ['success' => $result];
    }

    public function delete($id, $userId = null, $userRole = null)
    {
        if ($userId !== null && $userRole !== null) {
            $role = ($userRole === 'admin') ? 'admin' : 'client';
            $result = $this->sql->delete(
                "DELETE FROM notifications WHERE id = :id AND user_id = :user_id AND user_role = :user_role", 
                [':id' => (int)$id, ':user_id' => (int)$userId, ':user_role' => $role]
            );
        } else {
            $result = $this->sql->delete("DELETE FROM notifications WHERE id = :id", [':id' => (int)$id]);
        }
        return ['success' => $result];
    }

    public function deleteAll($userId, $userRole = 'client')
    {
        $role = ($userRole === 'admin') ? 'admin' : 'client';
        $result = $this->sql->delete(
            "DELETE FROM notifications WHERE user_id = :user_id AND user_role = :user_role",
            [':user_id' => (int)$userId, ':user_role' => $role]
        );
        return ['success' => $result];
    }

    public function getUnreadCount($userId, $userRole = 'client')
    {
        $role = ($userRole === 'admin') ? 'admin' : 'client';
        $result = $this->sql->getAll(
            "SELECT COUNT(*) as count FROM notifications WHERE user_id = :user_id AND user_role = :user_role AND is_read = FALSE",
            [':user_id' => (int)$userId, ':user_role' => $role]
        );
        return ['count' => $result[0]['count'] ?? 0];
    }
}
