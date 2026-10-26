<?php 

require_once __DIR__ . '/../models/Sql.php';

class Payments
{
    public function getAll()
    {
        $sql = new Sql();
        return $sql->getAll("SELECT * FROM payments");
    }

    public function show($id)
    {
        $sql = new Sql();
        return $sql->getId("SELECT * FROM payments WHERE id = :id", ['id' => $id]);
    }

    public function store($project_id, $amount, $payment_date, $client_id)
    {
        $sql = new Sql();
        return $sql->update("INSERT INTO payments (project_id, amount, payment_date, client_id) VALUES (:project_id, :amount, :payment_date, :client_id)", ['project_id' => $project_id, 'amount' => $amount, 'payment_date' => $payment_date, 'client_id' => $client_id]);
    }

    public function update($id, $amount, $payment_date, $client_id)
    {
        $sql = new Sql();
        return $sql->update("UPDATE payments SET amount = :amount, payment_date = :payment_date, client_id = :client_id WHERE id = :id", ['id' => $id, 'amount' => $amount, 'payment_date' => $payment_date, 'client_id' => $client_id]);
    }

    public function delete($id)
    {
        $sql = new Sql();
        try {
            $result = $sql->delete("DELETE FROM payments WHERE id = :id", ['id' => $id]);
            if (!$result) {
                http_response_code(404);
                return ['success' => false, 'error' => 'Paiement non trouvé.'];
            }
            return ['success' => true];
        } catch (PDOException $e) {
            http_response_code(500);
            return ['success' => false, 'error' => 'Erreur serveur lors de la suppression du paiement.'];
        }
    }
}







?>