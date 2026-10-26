<?php

require_once __DIR__ . '/../models/JwtHelper.php';
require_once __DIR__ . '/../routes/config.php';

class Middleware
{
    /**
     * Get Authorization header from various server environments
     *
     * @return string|null
     */
    public static function getAuthorizationHeader()
    {
        if (isset($_SERVER['HTTP_AUTHORIZATION'])) {
            return trim($_SERVER['HTTP_AUTHORIZATION']);
        }
        if (isset($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
            return trim($_SERVER['REDIRECT_HTTP_AUTHORIZATION']);
        }
        if (isset($_SERVER['Authorization'])) {
            return trim($_SERVER['Authorization']);
        }
        if (function_exists('apache_request_headers')) {
            $headers = apache_request_headers();
            if ($headers) {
                $headers = array_change_key_case($headers, CASE_LOWER);
                if (isset($headers['authorization'])) {
                    return trim($headers['authorization']);
                }
            }
        }
        if (function_exists('getallheaders')) {
            $headers = getallheaders();
            if ($headers) {
                $headers = array_change_key_case($headers, CASE_LOWER);
                if (isset($headers['authorization'])) {
                    return trim($headers['authorization']);
                }
            }
        }
        return null;
    }

    /**
     * Authenticates the request using JWT Bearer Token
     * 
     * @return array|void Returns decoded user data on success, or exits with 401 on failure.
     */
    public static function authenticate()
    {
        $authHeader = self::getAuthorizationHeader();

        if (!$authHeader || stripos($authHeader, 'Bearer ') !== 0) {
            http_response_code(401);
            echo json_encode([
                'success' => false,
                'error' => 'Non autorisé : En-tête Authorization manquant ou invalide.'
            ]);
            exit;
        }

        $token = trim(substr($authHeader, 7)); // Remove "Bearer " prefix
        JwtHelper::setSecret(JWT_SECRET);
        $decoded = JwtHelper::decode($token);

        if (!$decoded) {
            http_response_code(401);
            echo json_encode([
                'success' => false,
                'error' => 'Non autorisé : Token invalide ou expiré.'
            ]);
            exit;
        }

        return $decoded;
    }
}

