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

    public function create() {
        $model = new DiagnosisTemplate();
        $data =  $this->request->getJSON(true);

        $result = $model->insert($data);

        return $this->respondCreated([
            'status'=>'success',
            'inserted_id'=>(string) $result->getInsertedId() 
        ]);
    }

    public function update($id = null) {
        $model = new DiagnosisTemplate();
        $data =  $this->request->getJSON(true);

        $result = $model->update($id, $data);

        return $this->respond([
            'status' => 'updated'
        ]);
    }

    public function delete($id = null) {
        $model = new DiagnosisTemplate();
        $model->delete($id);

        return $this->respondDeleted([
            'status' => 'deleted'
        ]);
    }
}