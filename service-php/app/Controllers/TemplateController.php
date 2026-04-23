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

    public function update($id = null) {
        $model = new DiagnosisTemplate();
        $data =  $this->request->getJSON(true);

        $result = $model->updateOne($id, $data);

        return $this->respond([
            'status' => 'updated'
        ]);
    }

    public function delete($id = null) {
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