<?php

namespace App\Models;

use Config\Mongo;
use MongoDB\BSON\ObjectId;

class ConsultationHistory {
    protected $collection;

    public function __construct() {
        $client = Mongo::connect();
        $this->collection = $client->yubu_db->consultation_history;
    }

    public function getAll() {
        return $this->collection->find()->toArray();
    }

    public function insert($data) {
        $data['template_id'] = $data['template_id'] ?? null;
        $data['metadata'] = $data['metadata'] ?? [];
        $data['created_at'] = $data['created_at'] ?? date('c');

        $allowed = [
            'user_id',
            'category',
            'template_id',
            'problem',
            'ai_response',
            'metadata',
            'created_at'
        ];

        $data = array_intersect_key($data, array_flip($allowed));

        return $this->collection->insertOne($data);
    }

    public function findById($id) {
        return $this->collection->findOne([
            '_id' => new ObjectId($id)
        ]);
    }
}