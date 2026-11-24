INSERT INTO schools (school_name, school_code, address, contact_number, status, created_at, updated_at)
VALUES 
    ('Balangoda Ananda Maithreya Central College', 'BAMCC-001', 'Barnes Ratwatte Mawatha, Balangoda', '045-2287234', 'active', NOW() - INTERVAL '60 days', NOW() - INTERVAL '10 days'),
    ('St. Agnes Convent Balangoda', 'SACB-002', 'Convent Road, Balangoda', '045-2287512', 'active', NOW() - INTERVAL '45 days', NOW() - INTERVAL '5 days'),
    ('Meddakanda Maha Vidyalaya', 'MMV-003', 'Meddakanda, Balangoda', '045-2288110', 'active', NOW() - INTERVAL '30 days', NOW() - INTERVAL '2 days'),
    ('Jeilani National College', 'JNC-004', 'Colombo Road, Balangoda', '045-2289400', 'inactive', NOW() - INTERVAL '20 days', NOW() - INTERVAL '1 day'),
    ('Balangoda Buddhist Ladies College', 'BBLC-005', 'Station Road, Balangoda', '045-2289890', 'inactive', NOW() - INTERVAL '15 days', NOW() - INTERVAL '1 day')
ON CONFLICT (school_code) DO NOTHING;
