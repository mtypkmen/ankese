CREATE TABLE cities (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  country_code CHAR(2) NOT NULL,
  name VARCHAR(80) NOT NULL,
  slug VARCHAR(80) NOT NULL,
  UNIQUE KEY uk_cities_slug (slug),
  KEY ix_cities_country (country_code, name),
  CONSTRAINT fk_cities_country FOREIGN KEY (country_code) REFERENCES countries(code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE categories (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(80) NOT NULL,
  name_sq VARCHAR(80) NOT NULL,
  name_en VARCHAR(80) NOT NULL,
  sort SMALLINT NOT NULL DEFAULT 0,
  UNIQUE KEY uk_categories_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE companies (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(120) NOT NULL,
  name VARCHAR(120) NOT NULL,
  country_code CHAR(2) NOT NULL,
  city_id INT UNSIGNED NULL,
  category_id INT UNSIGNED NOT NULL,
  registry_no VARCHAR(30) NULL,
  website VARCHAR(200) NULL,
  status ENUM('active','hidden') NOT NULL DEFAULT 'active',
  created_at DATETIME NOT NULL DEFAULT (UTC_TIMESTAMP()),
  UNIQUE KEY uk_companies_slug (slug),
  KEY ix_companies_cat (category_id, status),
  KEY ix_companies_city (city_id, status),
  KEY ix_companies_name (name),
  CONSTRAINT fk_companies_country FOREIGN KEY (country_code) REFERENCES countries(code),
  CONSTRAINT fk_companies_city FOREIGN KEY (city_id) REFERENCES cities(id),
  CONSTRAINT fk_companies_cat FOREIGN KEY (category_id) REFERENCES categories(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE company_aliases (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  company_id BIGINT UNSIGNED NOT NULL,
  alias VARCHAR(120) NOT NULL,
  KEY ix_alias_company (company_id),
  KEY ix_alias_alias (alias),
  CONSTRAINT fk_alias_company FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO categories (slug, name_sq, name_en, sort) VALUES
 ('telefoni-internet','Telefonia dhe interneti','Telecom and internet',1),
 ('banka-hua','Bankat dhe huatë','Banks and loans',2),
 ('sigurime','Sigurimet','Insurance',3),
 ('blerje-online','Blerjet online','Online shopping',4),
 ('energji-uje','Energjia dhe uji','Energy and water',5),
 ('transport-poste','Transporti dhe posta','Transport and post',6),
 ('shendetesi','Shëndetësia','Healthcare',7),
 ('restorante-ushqim','Restorantet dhe ushqimi','Restaurants and food',8),
 ('pasuri-paluajtshme','Pasuritë e paluajtshme','Real estate',9),
 ('arsim','Arsimi','Education',10);

INSERT INTO cities (country_code, name, slug) VALUES
 ('AL','Tiranë','tirane'),('AL','Durrës','durres'),('AL','Vlorë','vlore'),('AL','Shkodër','shkoder'),
 ('AL','Elbasan','elbasan'),('AL','Fier','fier'),('AL','Korçë','korce'),('AL','Berat','berat'),
 ('AL','Lushnjë','lushnje'),('AL','Kamëz','kamez'),('AL','Pogradec','pogradec'),('AL','Lezhë','lezhe'),
 ('AL','Sarandë','sarande'),('AL','Gjirokastër','gjirokaster'),('AL','Kukës','kukes'),('AL','Kavajë','kavaje'),
 ('XK','Prishtinë','prishtine'),('XK','Prizren','prizren'),('XK','Pejë','peje'),('XK','Gjakovë','gjakove'),
 ('XK','Mitrovicë','mitrovice'),('XK','Ferizaj','ferizaj'),('XK','Gjilan','gjilan'),('XK','Vushtrri','vushtrri'),
 ('XK','Podujevë','podujeve'),('XK','Suharekë','suhareke'),('XK','Fushë Kosovë','fushe-kosove'),('XK','Drenas','drenas'),
 ('XK','Lipjan','lipjan'),('XK','Malishevë','malisheve'),('XK','Rahovec','rahovec'),('XK','Kamenicë','kamenice');
