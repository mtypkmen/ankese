CREATE TABLE users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(254) NOT NULL,
  pass_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(60) NOT NULL,
  role ENUM('member','moderator','admin') NOT NULL DEFAULT 'member',
  status ENUM('active','blocked') NOT NULL DEFAULT 'active',
  locale CHAR(2) NOT NULL DEFAULT 'sq',
  email_verified_at DATETIME NULL,
  failed_logins TINYINT UNSIGNED NOT NULL DEFAULT 0,
  locked_until DATETIME NULL,
  ip_hmac CHAR(64) NULL,
  created_at DATETIME NOT NULL DEFAULT (UTC_TIMESTAMP()),
  last_login_at DATETIME NULL,
  UNIQUE KEY uk_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE sessions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  token_hash CHAR(64) NOT NULL,
  ip_hmac CHAR(64) NULL,
  created_at DATETIME NOT NULL DEFAULT (UTC_TIMESTAMP()),
  expires_at DATETIME NOT NULL,
  UNIQUE KEY uk_sessions_token (token_hash),
  KEY ix_sessions_user (user_id),
  KEY ix_sessions_exp (expires_at),
  CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE email_tokens (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  purpose ENUM('verify','reset') NOT NULL,
  token_hash CHAR(64) NOT NULL,
  expires_at DATETIME NOT NULL,
  used_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT (UTC_TIMESTAMP()),
  UNIQUE KEY uk_tokens_hash (token_hash),
  KEY ix_tokens_user (user_id, purpose),
  KEY ix_tokens_exp (expires_at),
  CONSTRAINT fk_tokens_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE audit_log (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NULL,
  action VARCHAR(60) NOT NULL,
  meta JSON NULL,
  ip_hmac CHAR(64) NULL,
  created_at DATETIME NOT NULL DEFAULT (UTC_TIMESTAMP()),
  KEY ix_audit_user (user_id),
  KEY ix_audit_action (action, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
