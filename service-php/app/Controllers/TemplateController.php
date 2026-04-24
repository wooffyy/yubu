<?php

namespace App\Controllers;

use App\Models\DiagnosisTemplate;
use CodeIgniter\RESTful\ResourceController;

class TemplateController extends ResourceController {
    protected $format = 'json';
    
    public function index() {
        $model = new DiagnosisTemplate();
        $data = $model->getAll();

        return $this->respond($data);
    }

    public function show($id = null) {
        $model = new DiagnosisTemplate();
        $data = $model->findById($id);

        return $this->respond($data);
    }

    public function create() {
        $model = new DiagnosisTemplate();
        $data =  $this->request->getJSON(true);

        $result = $model->insertOne($data);

        return $this->respondCreated([
            'status'=>'success',
            'inserted_id'=>(string) $result->getInsertedId() 
        ]);
    }

    public function update($id = null) 
    {
        if (!$id) {
            return $this->fail('ID is required', 400);
        }

        $data = $this->request->getJSON(true);

        if (empty($data)) {
            return $this->fail('Request body tidak boleh kosong', 400);
        }

        $allowedFields = ['name', 'problem_category', 'system_prompt', 'user_prompt_template', 'variables', 'estimated_cost_range'];
        $filteredData = array_intersect_key($data, array_flip($allowedFields));

        if (empty($filteredData)) {
            return $this->fail('Tidak ada field valid yang dikirim', 400);
        }

        $model = new DiagnosisTemplate();
        $result = $model->updateOne($id, $filteredData);

        if ($result->getModifiedCount() === 0) {
            return $this->response->setStatusCode(404)->setJSON([
                'error' => 'Template not found atau no changes made'
            ]);
        }

        return $this->respond([
            'status' => 'updated'
        ]);
    }

    public function delete($id = null) 
    {
        $model = new DiagnosisTemplate();
        $result = $model->deleteOne($id);

        if ($result->getDeletedCount() === 0) {
            return $this->response->setStatusCode(404)->setJSON([
                'error' => 'Consultation not found'
            ]);
        }

        return $this->respondDeleted([
            'status' => 'deleted'
        ]);
    }
}