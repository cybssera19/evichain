BEGIN;
CREATE TABLE IF NOT EXISTS users (
  wallet TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  nip TEXT NOT NULL DEFAULT '',
  unit TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  requested_role TEXT NOT NULL DEFAULT '' CHECK (requested_role IN ('', 'Investigator', 'Analyst', 'Auditor'))
);
ALTER TABLE users ADD COLUMN IF NOT EXISTS requested_role TEXT NOT NULL DEFAULT '' CHECK (requested_role IN ('', 'Investigator', 'Analyst', 'Auditor'));
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_requested_role_check;
UPDATE users SET requested_role = CASE requested_role WHEN 'Penyidik' THEN 'Investigator' WHEN 'Analis' THEN 'Analyst' ELSE requested_role END WHERE requested_role IN ('Penyidik','Analis');
ALTER TABLE users ADD CONSTRAINT users_requested_role_check CHECK (requested_role IN ('','Investigator','Analyst','Auditor'));
CREATE TABLE IF NOT EXISTS cases (
  no TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Investigation',
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE cases ADD COLUMN IF NOT EXISTS source_key TEXT NOT NULL DEFAULT 'legacy';
ALTER TABLE cases ALTER COLUMN status SET DEFAULT 'Investigation';
UPDATE cases SET status = CASE status WHEN 'Penyidikan' THEN 'Investigation' WHEN 'Pemberkasan' THEN 'Filing' WHEN 'Selesai' THEN 'Closed' ELSE status END WHERE status IN ('Penyidikan','Pemberkasan','Selesai');
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='cases'::regclass AND contype='p' AND cardinality(conkey)=1) THEN
    ALTER TABLE cases DROP CONSTRAINT cases_pkey;
    ALTER TABLE cases ADD PRIMARY KEY (source_key,no);
  END IF;
END $$;
CREATE TABLE IF NOT EXISTS evidence_files (
  evidence_id BIGINT PRIMARY KEY,
  stored_name TEXT NOT NULL,
  original_name TEXT NOT NULL,
  size_bytes BIGINT NOT NULL,
  uploader TEXT NOT NULL,
  sha256 TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE evidence_files ADD COLUMN IF NOT EXISTS source_key TEXT NOT NULL DEFAULT 'legacy';
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='evidence_files'::regclass AND contype='p' AND cardinality(conkey)=1) THEN
    ALTER TABLE evidence_files DROP CONSTRAINT evidence_files_pkey;
    ALTER TABLE evidence_files ADD PRIMARY KEY (source_key,evidence_id);
  END IF;
END $$;
COMMIT;
