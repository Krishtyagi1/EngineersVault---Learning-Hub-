ALTER TABLE resources DROP CONSTRAINT resources_type_check;
ALTER TABLE resources ADD CHECK (type IN ('video', 'book', 'note'));

CREATE UNIQUE INDEX disciplines_label_unique ON disciplines(lower(label));

CREATE TABLE subject_submissions (
  id varchar(20) PRIMARY KEY CHECK (id ~ '^[0-9a-f]{20}$'),
  label varchar(100) NOT NULL,
  description varchar(500) NOT NULL,
  submitted_by uuid NOT NULL REFERENCES users(id),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_by uuid REFERENCES users(id),
  reviewed_at timestamptz,
  review_note varchar(1000)
);
CREATE UNIQUE INDEX subject_submissions_label_unique ON subject_submissions(lower(label))
  WHERE status IN ('pending', 'approved');
CREATE INDEX subject_submissions_author_idx ON subject_submissions(submitted_by);
