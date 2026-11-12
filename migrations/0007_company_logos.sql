ALTER TABLE companies ADD COLUMN logo VARCHAR(120) NULL AFTER website;

INSERT INTO categories (slug, name_sq, name_en, sort) VALUES
 ('shitje-me-pakice','Tregtia me pakicë','Retail',11),
 ('automjete','Automjetet','Automotive',12),
 ('hotele-udhetime','Hotelet dhe udhëtimet','Hotels and travel',13);
