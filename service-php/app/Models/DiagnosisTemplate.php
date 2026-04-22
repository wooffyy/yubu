<?php

namespace App\Models;

use Config\Mongo;

class DiagnosisTemplate extends \CodeIgniter\Model {
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

    public function updateOne($id, $data) { 
        return $this->collection->updateOne(
            ['_id' => new \MongoDB\BSON\ObjectId($id)],
            ['$set' => $data]
        );
    }

    public function insertOne($data) {
        return $this->collection->insertOne($data);
    }

    public function deleteOne($id) {
        return $this->collection->deleteOne([
            '_id' => new \MongoDB\BSON\ObjectId($id)
        ]);
    }
}