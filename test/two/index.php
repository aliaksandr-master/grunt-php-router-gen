<?php

error_reporting(E_ALL);
ini_set('display_errors', 1);

echo '<pre>'.file_get_contents('./routes_two.txt').'</pre>';

require_once('./../Router.php');

$router = new Router(json_decode(file_get_contents('../../tmp/routes_two.json'), true));
$result = $router->match($_SERVER['REQUEST_METHOD'], $_SERVER['REQUEST_URI']);

print('<hr>');
var_dump($result);

print('<hr>');
$result = $router->reverse(null, 'user.get.all', array('version'=>111));
var_dump($result);

print('<hr>');
$result = $router->reverse('POST', 'user.post', array('version'=>222));
var_dump($result);

print('<hr>');
$result = $router->reverse('GET', 'user.get.one', array('version'=>333));
var_dump($result);

print('<hr>');
$result = $router->reverse('GET', 'user.get.one', array('version'=>333));
var_dump($result);

print('<hr>');
$result = $router->reverse('GET', 'user.get.all', array('version'=>333));
echo('<div><b>user.get.all</b>&nbsp;->&nbsp;&nbsp;'.$result.'</div>');

print('<hr>');
$result = $router->reverse('GET', 'user.get.all', array('version'=>333, 'id' => 3));
var_dump($result);