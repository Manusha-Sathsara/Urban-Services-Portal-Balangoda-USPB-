-- 000008_unify_schools_and_official_rates.up.sql
-- Adds contact_number to schools and seeds official Balangoda UC 3R waste purchase rates (from council price schedule).

ALTER TABLE schools
    ADD COLUMN IF NOT EXISTS contact_number VARCHAR(50) NOT NULL DEFAULT '';

INSERT INTO garbage_categories (name, description, measurement_unit, current_points_per_unit, status)
VALUES
    ('Oz Bottles (Pieces)', 'Small ounce glass bottles (pieces)', 'pcs', 3.00, 'active'),
    ('Square Liquor Bottle (750ml)', 'Clean 750ml square liquor bottles (pieces)', 'pcs', 12.00, 'active'),
    ('Half Square Bottle', 'Half square bottles (pieces)', 'pcs', 8.00, 'active'),
    ('Beer Bottle (LION)', 'LION beer glass bottles (pieces)', 'pcs', 20.00, 'active'),
    ('Quarter Bottle (175ml)', 'Clean 175ml quarter bottles (pieces)', 'pcs', 3.00, 'active'),
    ('Broken Glass', 'Sorted broken glass cullet', 'kg', 10.00, 'active'),
    ('Plastic', 'Clean household plastic items', 'kg', 40.00, 'active'),
    ('Newspapers', 'Dry bundled newspapers', 'kg', 30.00, 'active'),
    ('White Paper', 'Clean white office/writing paper', 'kg', 35.00, 'active'),
    ('Mixed Paper', 'General dry waste paper', 'kg', 10.00, 'active'),
    ('Books', 'Old books and exercise notebooks', 'kg', 35.00, 'active'),
    ('Cardboard', 'Dry corrugated cardboard boxes', 'kg', 20.00, 'active'),
    ('Coconut Shells', 'Clean dry coconut shells', 'kg', 40.00, 'active'),
    ('Beer Cans (Aluminium)', 'Empty aluminium beverage cans', 'kg', 110.00, 'active'),
    ('Iron Scrap', 'Clean scrap iron', 'kg', 70.00, 'active'),
    ('Tin / Sheet Metal', 'Clean tin and sheet metal scrap', 'kg', 8.00, 'active'),
    ('Aluminium', 'Clean aluminium scrap', 'kg', 250.00, 'active'),
    ('PET Bottles', 'Clean PET plastic bottles (caps removed)', 'kg', 50.00, 'active'),
    ('Glass / Tin Jars', 'Clean assorted jars', 'kg', 15.00, 'active'),
    ('Vehicle Batteries', 'Spent vehicle lead-acid batteries', 'kg', 200.00, 'active'),
    ('Milo / Nestomalt Packets', 'Clean flattened beverage cartons', 'kg', 15.00, 'active'),
    ('Mixed Polythene', 'Clean dry polythene', 'kg', 5.00, 'active'),
    ('Heavy Plastic / Barrel Scrap', 'Heavy rigid plastic scrap', 'kg', 8.00, 'active'),
    ('Electrical Wire', 'Insulated copper/electrical wire', 'kg', 25.00, 'active'),
    ('PVC', 'Clean PVC pipe offcuts and fittings', 'kg', 50.00, 'active')
ON CONFLICT (name) DO NOTHING;
