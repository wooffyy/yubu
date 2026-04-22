<?php

namespace App\Controllers;

use App\Models\ConsultationHistory;
use CodeIgniter\RESTful\ResourceController;

class ConsultationController extends ResourceController
{
    protected $format = 'json';

    public function index()
    {
        $model = new ConsultationHistory();
        $data = $model->getAll();

        return $this->respond([
            'status' => 'success',
            'data' => $data
        ]);
    }

    public function create()
    {
        $model = new ConsultationHistory();
        $data = $this->request->getJSON(true);

        if (!$data || !isset($data['user_id']) || !isset($data['problem'])) {
            return $this->fail('Invalid input', 400);
        }

        $result = $model->insertOne($data);

        return $this->respondCreated([
            'status' => 'success',
            'inserted_id' => (string) $result->getInsertedId()
        ]);
    }

    public function delete($id = null)
    {
        if (!$id) {
            return $this->fail('ID is required', 400);
        }

        $model = new ConsultationHistory();
        $model->deleteOne($id);

        return $this->respondDeleted([
            'status' => 'deleted'
        ]);
    }
}