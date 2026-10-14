-- ==============================================================================
-- CloudLib Pro - Seed Data for B.Tech CSE Cloud Computing Project
-- Safe Seed Data with Books, Categories, Settings, Sample Loans & Notifications
-- ==============================================================================

-- 1. Insert Library Settings
INSERT INTO library_settings (id, max_borrow_limit, loan_duration_days, max_renewal_count, late_fee_per_day, reservation_pickup_days, enable_late_fees)
VALUES ('00000000-0000-0000-0000-000000000001', 4, 14, 2, 2.00, 3, true)
ON CONFLICT (id) DO UPDATE 
SET max_borrow_limit = 4, loan_duration_days = 14;

-- 2. Insert Categories
INSERT INTO categories (id, name, slug, description, icon) VALUES
('11111111-0000-0000-0000-000000000001', 'Cloud Computing & DevOps', 'cloud-computing', 'Virtualization, AWS, GCP, Azure, Docker, Kubernetes & Serverless', 'Cloud'),
('11111111-0000-0000-0000-000000000002', 'Artificial Intelligence & ML', 'ai-ml', 'Deep Learning, Neural Networks, NLP, Generative AI & Robotics', 'Brain'),
('11111111-0000-0000-0000-000000000003', 'Data Structures & Algorithms', 'dsa', 'Algorithms, Graphs, Trees, Dynamic Programming & Complexity', 'Code2'),
('11111111-0000-0000-0000-000000000004', 'Distributed Systems', 'distributed-systems', 'Consensus protocols, microservices, RPC & scalability', 'Network'),
('11111111-0000-0000-0000-000000000005', 'Database Systems', 'databases', 'Relational SQL, NoSQL, NewSQL, Indexing & Transaction Isolation', 'Database'),
('11111111-0000-0000-0000-000000000006', 'Cybersecurity & Cryptography', 'cybersecurity', 'Network security, zero trust, encryption & penetration testing', 'ShieldAlert'),
('11111111-0000-0000-0000-000000000007', 'Software Engineering', 'software-engineering', 'System design, clean code, architecture patterns & agile', 'Layers')
ON CONFLICT (id) DO NOTHING;

-- 3. Insert Books
INSERT INTO books (id, isbn, title, author, publisher, publication_year, category_id, category_name, description, cover_url, edition, pages, shelf_location, total_copies, available_copies, issued_copies, reserved_copies) VALUES
(
    '22222222-0000-0000-0000-000000000001',
    '978-0134444321',
    'Cloud Computing: Concepts, Technology & Architecture',
    'Thomas Erl, Ricardo Puttini, Zaigham Mahmood',
    'Prentice Hall',
    2023,
    '11111111-0000-0000-0000-000000000001',
    'Cloud Computing & DevOps',
    'Comprehensive foundational reference on cloud delivery models, virtualization, multi-tenancy, and cloud-native architecture.',
    'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
    '2nd Edition',
    528,
    'Shelf C-101',
    5, 4, 1, 0
),
(
    '22222222-0000-0000-0000-000000000002',
    '978-1491950357',
    'Designing Data-Intensive Applications',
    'Martin Kleppmann',
    'O''Reilly Media',
    2022,
    '11111111-0000-0000-0000-000000000004',
    'Distributed Systems',
    'The definitive guide to the storage, processing, and architecture of scalable distributed systems and databases.',
    'https://images.unsplash.com/photo-1532012164546-f432f2e3777f?auto=format&fit=crop&w=600&q=80',
    '1st Edition',
    616,
    'Shelf D-204',
    4, 2, 2, 0
),
(
    '22222222-0000-0000-0000-000000000003',
    '978-0262033848',
    'Introduction to Algorithms (CLRS)',
    'Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest, Clifford Stein',
    'MIT Press',
    2022,
    '11111111-0000-0000-0000-000000000003',
    'Data Structures & Algorithms',
    'Essential textbook covering modern algorithm design, graph traversal, greedy techniques, dynamic programming, and NP-completeness.',
    'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=600&q=80',
    '4th Edition',
    1312,
    'Shelf A-012',
    6, 3, 2, 1
),
(
    '22222222-0000-0000-0000-000000000004',
    '978-0131103627',
    'The C Programming Language',
    'Brian W. Kernighan, Dennis M. Ritchie',
    'Prentice Hall',
    2020,
    '11111111-0000-0000-0000-000000000003',
    'Data Structures & Algorithms',
    'The authoritative and classic reference to the C programming language written by the designers.',
    'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&w=600&q=80',
    '2nd Edition',
    272,
    'Shelf A-045',
    3, 3, 0, 0
),
(
    '22222222-0000-0000-0000-000000000005',
    '978-1492043454',
    'Kubernetes: Up and Running',
    'Brendan Burns, Joe Beda, Kelsey Hightower, Lachlan Evenson',
    'O''Reilly Media',
    2023,
    '11111111-0000-0000-0000-000000000001',
    'Cloud Computing & DevOps',
    'Dive deep into container orchestration, pods, deployments, ingress controllers, and cloud-native services.',
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80',
    '3rd Edition',
    340,
    'Shelf C-115',
    4, 1, 2, 1
),
(
    '22222222-0000-0000-0000-000000000006',
    '978-0134757599',
    'Operating Systems: Three Easy Pieces',
    'Remzi H. Arpaci-Dusseau, Andrea C. Arpaci-Dusseau',
    'CreateSpace',
    2021,
    '11111111-0000-0000-0000-000000000004',
    'Distributed Systems',
    'Virtualization, Concurrency, and Persistence. Fundamental textbook for computer systems engineers.',
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=600&q=80',
    '1.01 Edition',
    714,
    'Shelf B-110',
    3, 2, 1, 0
),
(
    '22222222-0000-0000-0000-000000000007',
    '978-0132350884',
    'Clean Code: A Handbook of Agile Software Craftsmanship',
    'Robert C. Martin (Uncle Bob)',
    'Prentice Hall',
    2021,
    '11111111-0000-0000-0000-000000000007',
    'Software Engineering',
    'Best practices for writing readable, maintainable, testable code with principles of software craft.',
    'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=600&q=80',
    '1st Edition',
    464,
    'Shelf S-301',
    5, 4, 1, 0
),
(
    '22222222-0000-0000-0000-000000000008',
    '978-1449373320',
    'Designing Distributed Systems',
    'Brendan Burns',
    'O''Reilly Media',
    2022,
    '11111111-0000-0000-0000-000000000001',
    'Cloud Computing & DevOps',
    'Patterns and paradigms for scalable, reliable services running on container clouds.',
    'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80',
    '1st Edition',
    166,
    'Shelf C-120',
    3, 3, 0, 0
)
ON CONFLICT (id) DO NOTHING;

-- 4. Insert Inventory Barcode Copies
INSERT INTO book_copies (id, book_id, barcode, copy_number, status, condition) VALUES
('33333333-0000-0000-0000-000000000001', '22222222-0000-0000-0000-000000000001', 'BAR-CC-001', 1, 'available', 'good'),
('33333333-0000-0000-0000-000000000002', '22222222-0000-0000-0000-000000000001', 'BAR-CC-002', 2, 'issued', 'good'),
('33333333-0000-0000-0000-000000000003', '22222222-0000-0000-0000-000000000002', 'BAR-DDIA-001', 1, 'issued', 'good'),
('33333333-0000-0000-0000-000000000004', '22222222-0000-0000-0000-000000000002', 'BAR-DDIA-002', 2, 'available', 'new'),
('33333333-0000-0000-0000-000000000005', '22222222-0000-0000-0000-000000000003', 'BAR-CLRS-001', 1, 'issued', 'fair'),
('33333333-0000-0000-0000-000000000006', '22222222-0000-0000-0000-000000000005', 'BAR-K8S-001', 1, 'issued', 'new')
ON CONFLICT (id) DO NOTHING;
