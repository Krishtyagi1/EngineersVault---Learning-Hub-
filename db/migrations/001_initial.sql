CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(80) NOT NULL,
  email varchar(254) UNIQUE NOT NULL CHECK (email = lower(email)),
  password_hash text NOT NULL,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'admin')),
  credits integer NOT NULL DEFAULT 0 CHECK (credits >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE credit_policy (
  id integer PRIMARY KEY CHECK (id = 1),
  approval_award integer NOT NULL CHECK (approval_award BETWEEN 0 AND 1000),
  posting_threshold integer NOT NULL CHECK (posting_threshold BETWEEN 0 AND 1000000),
  reviewing_threshold integer NOT NULL CHECK (reviewing_threshold BETWEEN 0 AND 1000000),
  updated_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO credit_policy VALUES (1, 10, 100, 250, now());
CREATE TABLE disciplines (
  id varchar(20) PRIMARY KEY,
  label varchar(100) NOT NULL,
  description text NOT NULL,
  position integer NOT NULL
);
CREATE TABLE resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title varchar(200) NOT NULL,
  type text NOT NULL CHECK (type IN ('video', 'book')),
  discipline_id varchar(20) NOT NULL REFERENCES disciplines(id),
  provider varchar(160) NOT NULL,
  url text NOT NULL UNIQUE,
  thumbnail_url text,
  duration_label varchar(60),
  topics jsonb NOT NULL DEFAULT '[]',
  tags jsonb NOT NULL DEFAULT '[]',
  notes_url text,
  notes_label varchar(100),
  description varchar(2000) NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  published boolean NOT NULL DEFAULT false,
  submitted_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  review_note varchar(1000),
  CHECK (status <> 'rejected' OR published = false),
  CHECK (status <> 'approved' OR published = true)
);
CREATE INDEX resources_queue_idx ON resources(created_at) WHERE status = 'pending';
CREATE INDEX resources_author_idx ON resources(submitted_by);
CREATE TABLE reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id uuid NOT NULL UNIQUE REFERENCES resources(id),
  reviewer_id uuid NOT NULL REFERENCES users(id),
  decision text NOT NULL CHECK (decision IN ('approved', 'rejected')),
  reason varchar(1000) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE credit_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id),
  resource_id uuid REFERENCES resources(id),
  actor_id uuid REFERENCES users(id),
  delta integer NOT NULL,
  reason varchar(1000) NOT NULL,
  kind text NOT NULL CHECK (kind IN ('approval', 'adjustment')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX credit_approval_once ON credit_ledger(resource_id) WHERE kind = 'approval';
CREATE INDEX credit_user_idx ON credit_ledger(user_id, created_at DESC);
CREATE TABLE sessions (
  token_hash text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  csrf_token text NOT NULL,
  expires_at timestamptz NOT NULL
);
CREATE INDEX session_expiry_idx ON sessions(expires_at);
CREATE TABLE audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES users(id),
  action text NOT NULL,
  details jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
