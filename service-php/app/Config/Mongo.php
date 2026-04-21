<?php

namespace Config;

use MongoDB\Client;

class Mongo
{
    public static function connect()
    {
        return new Client("mongodb://127.0.0.1:27017");
    }
}