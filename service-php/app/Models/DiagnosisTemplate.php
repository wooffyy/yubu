<?php

namespace App\Models;

use Config\Mongo;

class DiagnosisTemplate {
    protected $collection;

    public function __construct() {
        $client = Mongo::connect();
        $this->collection = $client->yubu_db->diagnosis_templates;
    }

    public function getAll() {
        return $this->collection->find()->toArray();
    }

    public function findById($id) {
        return $this->collection->findOne([
            '_id' => new \MongoDB\BSON\ObjectId($id)
        ]);
    }

    public function insert($data) {
        return $this->collection->insertOne($data);
    }
}