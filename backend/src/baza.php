<?php
declare(strict_types=1);
function db(): PDO {
  static $pdo;
  if (!isset($pdo)) {
    $host = getenv('DB_HOST') ?: '127.0.0.1'; $name = getenv('DB_NAME') ?: 'dom_dela';
    $pdo = new PDO("mysql:host=$host;dbname=$name;charset=utf8mb4", getenv('DB_USER') ?: 'root', getenv('DB_PASS') ?: '', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC, PDO::ATTR_EMULATE_PREPARES => false]);
  }
  return $pdo;
}
function run(string $sql, array $params = []): PDOStatement { $q = db()->prepare($sql); $q->execute($params); return $q; }
function one(string $sql, array $params = []): array|false { return run($sql, $params)->fetch(); }
function many(string $sql, array $params = []): array { return run($sql, $params)->fetchAll(); }
