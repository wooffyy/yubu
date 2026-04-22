<?php

use CodeIgniter\Router\RouteCollection;

$routes->get('/', 'Home::index');

// templates
$routes->get('/templates', 'TemplateController::index');
$routes->get('/templates/(:any)', 'TemplateController::show/$1');
$routes->post('/templates', 'TemplateController::create');
$routes->put('/templates/(:any)', 'TemplateController::update/$1');
$routes->delete('/templates/(:any)', 'TemplateController::delete/$1');

// consultations
$routes->get('/consultations', 'ConsultationController::index');
$routes->post('/consultations', 'ConsultationController::create');
$routes->delete('/consultations/(:any)', 'ConsultationController::delete/$1');

