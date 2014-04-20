<?php

$source = json_decode(file_get_contents('./routes_one.json'), true);

echo('<ul>');
foreach ($source as $route) {
	echo('<li>'.$route["name"].'&nbsp;&nbsp;&nbsp;->&nbsp;&nbsp;&nbsp;'.$route["method"].'&nbsp;&nbsp;&nbsp;'.$route["url"].'</li>');
}
echo('</ul>');

error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once('./../Router.php');

$routes = json_decode(file_get_contents('../../tmp/routes_one.json'), true);
//var_dump($routes);
$router = new Router($routes);
$result = $router->match($_SERVER['REQUEST_METHOD'], $_SERVER['REQUEST_URI']);

print('<hr>');
var_dump($result);