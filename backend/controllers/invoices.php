<?php

require_once __DIR__ . '/../models/Sql.php';


class Invoices
{
    public function getAll($clientId = null)
    {
        $sql = new Sql();
        $query = "SELECT i.*, p.name as project_name, c.name as client_name 
                  FROM invoices i
                  JOIN projects p ON i.project_id = p.id
                  JOIN clients c ON i.client_id = c.id";
        $params = [];

        if ($clientId) {
            $query .= " WHERE i.client_id = :client_id";
            $params['client_id'] = $clientId;
        }

        $query .= " ORDER BY i.created_at DESC";
        
        $invoices = $sql->getAll($query, $params);
        return [
            'success' => true,
            'data' => $invoices
        ];
    }


    public function getById($id)
    {
        $sql = new Sql();
        $invoice = $sql->getAll("SELECT * FROM invoices WHERE id = ?", [$id]);
        if (empty($invoice)) {
            return [
                'success' => false,
                'message' => 'Invoice not found'
            ];
        }
        return [
            'success' => true,
            'data' => $invoice[0]
        ];
    }

    public function create($data)
    {
        $sql = new Sql();
        $sql->create("INSERT INTO invoices (client_id, project_id, amount, status) VALUES (?, ?, ?, ?)", [
            $data['client_id'],
            $data['project_id'],
            $data['amount'],
            $data['status']
        ]);
        return [
            'success' => true,
            'message' => 'Invoice created successfully'
        ];
    }


    public function update($id, $data)
    {
        $sql = new Sql();
        $sql->update("UPDATE invoices SET client_id = ?, project_id = ?, amount = ?, status = ? WHERE id = ?", [
            $data['client_id'],
            $data['project_id'],
            $data['amount'],
            $data['status'],
            $id
        ]);
        return [
            'success' => true,
            'message' => 'Invoice updated successfully'
        ];
    }

    public function delete($id)
    {
        $sql = new Sql();
        try {
            $result = $sql->delete("DELETE FROM invoices WHERE id = :id", ['id' => $id]);
            if (!$result) {
                http_response_code(404);
                return ['success' => false, 'error' => 'Facture non trouvée.'];
            }
            return ['success' => true];
        } catch (PDOException $e) {
            if ($e->getCode() == '23000') {
                http_response_code(400);
                return ['success' => false, 'error' => 'Impossible de supprimer cette facture car elle est liée à des paiements.'];
            }
            http_response_code(500);
            return ['success' => false, 'error' => 'Erreur serveur lors de la suppression.'];
        }
    }
}

?>