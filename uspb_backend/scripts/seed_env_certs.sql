INSERT INTO env_cert_businesses (
    business_name,
    registration_no,
    owner_name,
    owner_nic,
    contact_phone,
    address,
    ward_no,
    business_category,
    status,
    issued_date,
    expiry_date
) VALUES
(
    'Rathna Ayurveda Pharmacy',
    'ENV-BAL-2026-101',
    'D. M. Rathnayake',
    '197845612390',
    '0714567890',
    'No. 12, Barnes Ratwatte Mawatha, Balangoda',
    'Ward 02',
    'Healthcare & Clinics',
    'APPROVED',
    NOW() - INTERVAL '4 months',
    NOW() + INTERVAL '8 months'
),
(
    'Kalthota Spice Mill',
    'ENV-BAL-2025-089',
    'W. A. Jayasena',
    '198212398765',
    '0765432198',
    'No. 74, Kalthota Road, Balangoda',
    'Ward 05',
    'Manufacturing & Tea',
    'APPROVED',
    NOW() - INTERVAL '13 months',
    NOW() - INTERVAL '1 month'
)
ON CONFLICT (registration_no) DO NOTHING;