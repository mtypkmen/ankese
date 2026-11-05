CREATE TABLE legal_requests (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  type ENUM('removal','reply','data','other') NOT NULL,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(254) NOT NULL,
  url VARCHAR(300) NULL,
  message TEXT NOT NULL,
  status ENUM('open','closed') NOT NULL DEFAULT 'open',
  ip_hmac CHAR(64) NULL,
  created_at DATETIME NOT NULL DEFAULT (UTC_TIMESTAMP()),
  closed_by BIGINT UNSIGNED NULL,
  closed_at DATETIME NULL,
  KEY ix_req_status (status, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
