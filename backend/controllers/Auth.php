<?php

require_once __DIR__ . '/../models/Sql.php';
require_once __DIR__ . '/../models/JwtHelper.php';
require_once __DIR__ . '/../models/TesterHelper.php';
require_once __DIR__ . '/../routes/config.php';

class Auth
{
    private $sql;

    public function __construct()
    {
        $this->sql = new Sql();
        JwtHelper::setSecret(JWT_SECRET);
    }

    public function register($data)
    {
        $username = htmlspecialchars(trim($data['username'] ?? ''));
        $name = htmlspecialchars(trim($data['name'] ?? ''));
        $password = $data['password'] ?? '';

        if (empty($username) || empty($password)) {
            return ['success' => false, 'error' => 'Username and password are required.'];
        }

        // Check if username exists
        $exists = $this->sql->getId("SELECT id FROM admin WHERE username = :username", ['username' => $username]);
        if ($exists) {
            return ['success' => false, 'error' => 'Username already exists.'];
        }

        $hashedPassword = password_hash($password, PASSWORD_BCRYPT);
        $id = $this->sql->create(
            "INSERT INTO admin (username, name, password) VALUES (:username, :name, :password)",
            ['username' => $username, 'name' => $name, 'password' => $hashedPassword]
        );

        if ($id) {
            return ['success' => true, 'message' => 'Administrator registered successfully.', 'id' => $id];
        }
        return ['success' => false, 'error' => 'Registration failed.'];
    }

    public function adminLogin($data)
    {
        $username = trim($data['username'] ?? '');
        $password = $data['password'] ?? '';

        $admin = $this->sql->getId("SELECT * FROM admin WHERE username = :username", ['username' => $username]);
        if ($admin && password_verify($password, $admin['password'])) {
            $isTester = in_array(strtolower($admin['username']), ['admin_tester', 'directeur_demo']);
            $payload = [
                'id' => (int)$admin['id'],
                'username' => $admin['username'],
                'name' => $admin['name'],
                'role' => 'admin',
                'is_tester' => $isTester,
                'exp' => time() + (24 * 60 * 60)
            ];
            $token = JwtHelper::encode($payload);
            return [
                'success' => true,
                'message' => 'Connexion réussie (Admin)',
                'token' => $token,
                'user' => [
                    'id' => (int)$admin['id'],
                    'username' => $admin['username'],
                    'name' => $admin['name'],
                    'role' => 'admin',
                    'is_tester' => $isTester
                ]
            ];
        }
        return ['success' => false, 'error' => 'Identifiants Admin invalides.'];
    }

    public function userLogin($data)
    {
        $username = trim($data['username'] ?? '');
        $password = $data['password'] ?? '';

        $client = $this->sql->getId(
            "SELECT * FROM clients WHERE username = :username OR email = :email",
            ['username' => $username, 'email' => $username]
        );
        if ($client && isset($client['password']) && password_verify($password, $client['password'])) {
            $isTester = in_array(strtolower($client['username'] ?? ''), ['user_tester', 'user']);
            $payload = [
                'id' => (int)$client['id'],
                'username' => $client['username'] ?? $client['email'],
                'name' => $client['name'],
                'role' => 'client',
                'is_tester' => $isTester,
                'exp' => time() + (24 * 60 * 60)
            ];
            $token = JwtHelper::encode($payload);
            return [
                'success' => true,
                'message' => 'Connexion réussie (Client)',
                'token' => $token,
                'user' => [
                    'id' => (int)$client['id'],
                    'username' => $client['username'] ?? $client['email'],
                    'name' => $client['name'],
                    'role' => 'client',
                    'is_tester' => $isTester
                ]
            ];
        }
        return ['success' => false, 'error' => 'Identifiants Client invalides.'];
    }

    public function resetTester()
    {
        return TesterHelper::resetTesterSandbox();
    }

    public function login($data)
    {
        // Keeping as fallback for generic login if needed
        $res = $this->adminLogin($data);
        if ($res['success']) return $res;
        return $this->userLogin($data);
    }
}
