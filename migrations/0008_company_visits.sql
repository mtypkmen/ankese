-- Firma sayfasi gunluk goruntulenme sayaci (Top 20 trend cizgisi ve grafigi icin). Gun UTC.
CREATE TABLE company_visits (
  company_id BIGINT UNSIGNED NOT NULL,
  day DATE NOT NULL,
  hits INT UNSIGNED NOT NULL DEFAULT 0,
  PRIMARY KEY (company_id, day),
  CONSTRAINT fk_visits_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
