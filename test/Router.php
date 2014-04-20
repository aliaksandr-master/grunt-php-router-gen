<?php

/**
 * Class Router
 */
class Router {

	const ROUTE_NAME = 'name';

	const PARAMS_NAME = 'params';

	const ROUTE_DATA_NAME = 'data';

	const INFINITE_ARG_NAME = '__INFINITE__';

	const ANY_METHOD_CHAR = '*';

	/** @var array */
	private $routes = array();

	/** @var array */
	private $routesByKey = null;


	/**
	 * @param array $routes
	 */
	function __construct (array $routes) {
		$this->routes = $routes;
	}


	/**
	 * @param string|null $httpMethod
	 * @param             $key
	 * @param array       $params
	 * @param null        $default
	 *
	 * @return mixed|null
	 */
	function reverse ($httpMethod, $key, array $params = array(), $default = null) {
		$httpMethod = $httpMethod ? strtoupper($httpMethod) : null;

		if (is_null($this->routesByKey)) {
			$this->routesByKey = array();
			foreach ($this->routes as $route) {
				$this->routesByKey[$route[self::ROUTE_NAME]][] = $route;
			}
		}
		if (isset($this->routesByKey[$key])) {

			$paramsAssoc = array();
			$paramsInfinite = array();

			foreach ($params as $paramKey => $paramValue) {
				if (is_numeric($paramKey)) {
					$paramsInfinite[$paramKey] = $paramValue;
				} else {
					$paramsAssoc[$paramKey] = $paramValue;
				}
			}

			ksort($paramsInfinite, SORT_NUMERIC);

			if (!empty($paramsInfinite) && !isset($paramsInfinite[0])) {
				return $default;
			}

			$hasArgs = !empty($paramsInfinite);

			foreach ($this->routesByKey[$key] as $route) {

				if ($httpMethod !== $route['method'] && $httpMethod !== self::ANY_METHOD_CHAR) {
					continue;
				}

				$_params = empty($route[self::ROUTE_DATA_NAME][self::PARAMS_NAME]) ? array() : $route[self::ROUTE_DATA_NAME][self::PARAMS_NAME];
				foreach ($_params as $paramKey => $paramValue) {
					if (!isset($params[$paramKey])) {
						if (is_numeric($paramKey)) {
							$paramsInfinite[$paramKey] = $paramValue;
						} else {
							$_paramsAssoc[$paramKey] = $paramValue;
						}
					}
				}

				$allArgNames = $route['args'];
				$url = $route['reverse'];

				$existsInfiniteArg = in_array(self::INFINITE_ARG_NAME, $allArgNames);

				$catch = true;
				foreach ($allArgNames as $argName) {
					if ($argName != self::INFINITE_ARG_NAME) {
						if (isset($paramsAssoc[$argName])) {
							$url = str_replace('<'.$argName.'>', $paramsAssoc[$argName], $url);
							$url = str_replace('<'.$argName.'?>', $paramsAssoc[$argName], $url);
						} else {
							$url = str_replace('<'.$argName.'?>', '', $url);
						}
					} else {
						if ($hasArgs) {
							$infinite = implode('/', $paramsInfinite);
							$url = str_replace('<'.$argName.'?>', $infinite, $url);
							$url = str_replace('<'.$argName.'>', $infinite, $url);
						} else {
							$url = str_replace('<'.$argName.'?>', '', $url);
							$url = str_replace('<'.$argName.'>', '', $url);
						}
					}
				}

				if ($catch) {
					$url = preg_replace('/^\#\^\/(\?)?/', '/', $url);
					$url = preg_replace('/(?:\[\/\]\?)?\$\#.+$/', '', $url);
					$url = preg_replace('#/+#', '/', $url);

					return $url;
				}
			}
		}

		return $default;
	}


	/**
	 * @param      $httpMethod
	 * @param      $url
	 * @param null $default
	 *
	 * @return array|null
	 */
	function match ($httpMethod, $url, $default = null) {
		$url = preg_replace("/\?.*$/", "", $url);
		$httpMethod = strtoupper($httpMethod);

		foreach ($this->routes as $route) {
			if (!$route['method'] || $route['method'] === $httpMethod) {
				if (preg_match($route["pattern"], $url, $params)) {
					array_shift($params);
					$result = array(
						"name" => $route[self::ROUTE_NAME]
					);
					if (!empty($route[self::ROUTE_DATA_NAME])) {
						$result = array_replace_recursive($route[self::ROUTE_DATA_NAME], $result);
					}
					foreach ($params as $paramKey => $paramValue) {
						if (!preg_match('/\d+/', $paramKey)) {
							$result['params'][$paramKey] = $paramValue;
						}
					}
					if (!empty($params[self::INFINITE_ARG_NAME])) {
						$args = $params[self::INFINITE_ARG_NAME];
						$args = preg_replace('#^/+#', '', $args);
						$args = preg_replace('#/+$#', '', $args);
						$args = preg_split('#/+#', $args);
						$result['params'] = array_merge($result['params'], $args);
						unset($result['params'][self::INFINITE_ARG_NAME]);
					}
					return $result;
				}
			}
		}

		return $default;
	}
}