<?php

require_once __DIR__ . '/../models/Sql.php';
require_once __DIR__ . '/../models/TesterHelper.php';

class Clients
{
    private $sql;

    public function __construct()
    {
        $this->sql = new Sql();
    }

    public function getAll($user = null)
    {
        $isTester = TesterHelper::isTester($user);

        if ($isTester) {
            // Test Admin ONLY sees the single designated default test client
            $testerId = TesterHelper::getTesterClientId($this->sql->getPdo());
            return $this->sql->getAll("SELECT * FROM clients WHERE id = :id LIMIT 1", [':id' => $testerId]);
        }

        // Super Admin sees all agency clients (excluding sandbox test client)
        $testerId = TesterHelper::getTesterClientId($this->sql->getPdo());
        return $this->sql->getAll("SELECT * FROM clients WHERE id != :tid ORDER BY created_at DESC", [':tid' => $testerId]);
    }

    public function show($id, $user = null)
    {
        $isTester = TesterHelper::isTester($user);
        if ($isTester) {
            $testerId = TesterHelper::getTesterClientId($this->sql->getPdo());
            if ((int)$id !== $testerId) {
                return null;
            }
        }
        return $this->sql->getId("SELECT * FROM clients WHERE id = :id", ['id' => $id]);
    }

    public function store($data, $user = null)
    {
        $isTester = TesterHelper::isTester($user);
        if ($isTester) {
            return [
                'success' => false,
                'error' => 'Règle du Testeur : Vous disposez déjà de votre client unique de test (@user_tester). La création de clients supplémentaires est désactivée.'
            ];
        }

        $errors = $this->validate($data);
        if (!empty($errors)) {
            return ['success' => false, 'errors' => $errors];
        }

        $password = !empty($data['password']) ? password_hash($data['password'], PASSWORD_BCRYPT) : null;

        $result = $this->sql->create(
            "INSERT INTO clients (name, username, password, phone, email, address) VALUES (:name, :username, :password, :phone, :email, :address)",
            [
                ':name' => trim($data['name']),
                ':username' => trim($data['username'] ?? ''),
                ':password' => $password,
                ':phone' => trim($data['phone'] ?? ''),
                ':email' => trim($data['email']),
                ':address' => trim($data['address'] ?? '')
            ]
        );

        return $result ? ['success' => true, 'id' => $result] : ['success' => false, 'error' => 'Échec de la création du client'];
    }

    public function update($id, $data, $user = null)
    {
        $isTester = TesterHelper::isTester($user);
        if ($isTester) {
            $testerId = TesterHelper::getTesterClientId($this->sql->getPdo());
            if ((int)$id !== $testerId) {
                return ['success' => false, 'error' => 'Modification non autorisée.'];
            }
        }

        $errors = $this->validate($data, $id);
        if (!empty($errors)) {
            return ['success' => false, 'errors' => $errors];
        }

        $sql = "UPDATE clients SET name = :name, username = :username, phone = :phone, email = :email, address = :address";
        $params = [
            ':id' => $id,
            ':name' => trim($data['name']),
            ':username' => trim($data['username'] ?? ''),
            ':phone' => trim($data['phone'] ?? ''),
            ':email' => trim($data['email']),
            ':address' => trim($data['address'] ?? '')
        ];

        if (!empty($data['password'])) {
            $sql .= ", password = :password";
            $params[':password'] = password_hash($data['password'], PASSWORD_BCRYPT);
        }

        $sql .= " WHERE id = :id";
        $result = $this->sql->update($sql, $params);

        return ['success' => $result];
    }

    public function delete($id, $user = null)
    {
        $isTester = TesterHelper::isTester($user);
        if ($isTester) {
            return [
                'success' => false,
                'error' => 'Action interdite : Le client de test par défaut ne peut pas être supprimé.'
            ];
        }

        try {
            // 1. Delete associated payments
            $this->sql->delete("DELETE FROM payments WHERE client_id = :id", ['id' => $id]);
            
            // 2. Delete associated invoices
            $this->sql->delete("DELETE FROM invoices WHERE client_id = :id", ['id' => $id]);
            
            // 3. Delete associated projects
            $this->sql->delete("DELETE FROM projects WHERE client_id = :id", ['id' => $id]);

            // 4. Finally delete the client
            $result = $this->sql->delete("DELETE FROM clients WHERE id = :id", ['id' => $id]);
            
            return ['success' => $result];
        } catch (Exception $e) {
            return ['success' => false, 'error' => $e->getMessage()];
        }
    }

    private function validate($data, $id = null)
    {
        $errors = [];
        if (empty($data['name'])) $errors[] = "Le nom est requis.";
        
        if (!$id) { // Only require these on creation
            if (empty($data['username'])) $errors[] = "L'identifiant est requis pour l'accès au portail.";
            if (empty($data['password'])) $errors[] = "Le mot de passe est requis pour l'accès au portail.";
        }
        
        if (empty($data['email'])) {
            $errors[] = "L'email est requis.";
        } elseif (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            $errors[] = "Format d'email invalide.";
        } else {
            // Check for duplicate email
            $sql = "SELECT id FROM clients WHERE email = :email";
            $params = [':email' => $data['email']];
            if ($id) {
                $sql .= " AND id != :id";
                $params[':id'] = $id;
            }
            if ($this->sql->getId($sql, $params)) {
                $errors[] = "L'email est déjà utilisé.";
            }
        }

        // Check for duplicate username
        if (!empty($data['username'])) {
            $sql = "SELECT id FROM clients WHERE username = :username";
            $params = [':username' => $data['username']];
            if ($id) {
                $sql .= " AND id != :id";
                $params[':id'] = $id;
            }
            if ($this->sql->getId($sql, $params)) {
                $errors[] = "Le nom d'utilisateur est déjà utilisé.";
            }
        }

        return $errors;
    }
}
