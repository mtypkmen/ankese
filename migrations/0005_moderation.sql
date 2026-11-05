ALTER TABLE users
  ADD COLUMN totp_secret VARCHAR(200) NULL,
  ADD COLUMN totp_enabled_at DATETIME NULL,
  ADD COLUMN totp_last_step BIGINT NULL;

ALTER TABLE sessions
  ADD COLUMN scope ENUM('site','panel') NOT NULL DEFAULT 'site';

ALTER TABLE complaints
  ADD COLUMN body_hash CHAR(64) NULL,
  ADD COLUMN reviewed_by BIGINT UNSIGNED NULL,
  ADD COLUMN reviewed_at DATETIME NULL,
  ADD KEY ix_comp_hash (body_hash);

CREATE TABLE complaint_edits (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  complaint_id BIGINT UNSIGNED NOT NULL,
  editor_id BIGINT UNSIGNED NOT NULL,
  old_title VARCHAR(140) NOT NULL,
  old_body TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT (UTC_TIMESTAMP()),
  KEY ix_edits_complaint (complaint_id),
  CONSTRAINT fk_edits_complaint FOREIGN KEY (complaint_id) REFERENCES complaints(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE moderation_log (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  actor_id BIGINT UNSIGNED NOT NULL,
  target_type VARCHAR(30) NOT NULL,
  target_id BIGINT UNSIGNED NOT NULL,
  action VARCHAR(40) NOT NULL,
  note VARCHAR(500) NULL,
  created_at DATETIME NOT NULL DEFAULT (UTC_TIMESTAMP()),
  KEY ix_modlog_target (target_type, target_id),
  KEY ix_modlog_time (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE blocklist (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  term VARCHAR(80) NOT NULL,
  kind ENUM('profanity','insult','threat','hate','accusation') NOT NULL,
  severity TINYINT UNSIGNED NOT NULL DEFAULT 1,
  mode ENUM('exact','stem') NOT NULL DEFAULT 'exact',
  lang VARCHAR(8) NOT NULL DEFAULT 'sq',
  note VARCHAR(200) NULL,
  created_at DATETIME NOT NULL DEFAULT (UTC_TIMESTAMP()),
  UNIQUE KEY uk_block_term (term, kind)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- BASLANGIC LISTESI: terimler ascii/kucuk harf/tekrarsiz harf (normalize) bicimindedir.
-- Arnavutca icin yerel bir okuyucu tarafindan gozden gecirilmelidir; panelden duzenlenir.
INSERT INTO blocklist (term, kind, severity, mode, lang) VALUES
 ('kurv','profanity',2,'stem','sq'),('pidh','profanity',2,'stem','sq'),('byth','profanity',2,'stem','sq'),
 ('qifsh','profanity',3,'stem','sq'),('mut','profanity',2,'exact','sq'),('shkerdh','profanity',3,'stem','sq'),
 ('kopil','insult',2,'stem','sq'),('budall','insult',1,'stem','sq'),('idiot','insult',1,'stem','sq'),
 ('gomar','insult',1,'stem','sq'),('hajvan','insult',1,'stem','sq'),('zuzar','insult',1,'stem','sq'),('pele','insult',1,'exact','sq'),
 ('te vras','threat',3,'exact','sq'),('do te vras','threat',3,'exact','sq'),('ta vras','threat',3,'exact','sq'),
 ('te mbys','threat',3,'exact','sq'),('do te mbys','threat',3,'exact','sq'),('ta djeg','threat',3,'exact','sq'),
 ('te rah','threat',2,'exact','sq'),('do te rah','threat',2,'exact','sq'),
 ('fuck','profanity',2,'stem','en'),('shit','profanity',2,'stem','en'),('bitch','profanity',2,'stem','en'),
 ('asshole','profanity',2,'stem','en'),('bastard','insult',2,'stem','en'),('cunt','profanity',3,'stem','en'),
 ('dick','profanity',2,'exact','en'),('whore','profanity',2,'stem','en'),('slut','profanity',2,'stem','en'),
 ('moron','insult',1,'stem','en'),('kill you','threat',3,'exact','en'),('i will kill','threat',3,'exact','en'),
 ('jeb','profanity',2,'stem','sr'),('kurac','profanity',3,'exact','sr'),('pick','profanity',2,'stem','sr'),
 ('govn','profanity',2,'stem','sr'),('sranj','profanity',2,'stem','sr'),('pizd','profanity',3,'stem','sr'),
 ('orospu','profanity',3,'stem','tr'),('amk','profanity',2,'exact','tr'),('siktir','profanity',3,'stem','tr'),('yarrak','profanity',3,'stem','tr'),
 ('peder','hate',2,'exact','sq'),('pederast','hate',2,'stem','sq'),('ibne','hate',2,'exact','tr'),('fagot','hate',2,'exact','en'),
 ('faggot','hate',2,'exact','en'),('shkij','hate',2,'stem','sq'),('cigan','hate',2,'stem','sq'),('nigg','hate',3,'stem','en'),('kaur','hate',2,'exact','sq'),
 ('hajdut','accusation',1,'stem','sq'),('vjedhes','accusation',1,'stem','sq'),('mashtr','accusation',1,'stem','sq'),
 ('kriminel','accusation',1,'stem','sq'),('mafioz','accusation',1,'stem','sq'),('trafikant','accusation',1,'stem','sq'),
 ('thief','accusation',1,'exact','en'),('scammer','accusation',1,'exact','en'),('fraud','accusation',1,'stem','en'),('criminal','accusation',1,'stem','en');
