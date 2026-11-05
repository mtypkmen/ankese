CREATE TABLE countries (
  code CHAR(2) NOT NULL PRIMARY KEY,
  name_sq VARCHAR(60) NOT NULL,
  name_en VARCHAR(60) NOT NULL,
  currency CHAR(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO countries (code, name_sq, name_en, currency) VALUES
  ('AL', 'Shqipëri', 'Albania', 'ALL'),
  ('XK', 'Kosovë', 'Kosovo', 'EUR');
