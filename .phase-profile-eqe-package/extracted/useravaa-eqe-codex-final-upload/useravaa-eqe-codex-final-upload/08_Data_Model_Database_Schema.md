# Data Model / Database Schema

```sql
CREATE TABLE experience_question_templates (
  id VARCHAR PRIMARY KEY,
  category VARCHAR NOT NULL,
  template_text TEXT NOT NULL,
  required_fields JSONB NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE provider_weekly_questions (
  id VARCHAR PRIMARY KEY,
  provider_id VARCHAR NOT NULL,
  profile_id VARCHAR NOT NULL,
  template_id VARCHAR NOT NULL REFERENCES experience_question_templates(id),
  rendered_question TEXT NOT NULL,
  week_start_date DATE NOT NULL,
  status VARCHAR NOT NULL CHECK (status IN ('active','replaced','skipped','expired')),
  replaced_by_question_id VARCHAR NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE experience_answers (
  id VARCHAR PRIMARY KEY,
  weekly_question_id VARCHAR NOT NULL REFERENCES provider_weekly_questions(id),
  provider_id VARCHAR NOT NULL,
  profile_id VARCHAR NOT NULL,
  answer_text TEXT NOT NULL,
  status VARCHAR NOT NULL CHECK (status IN ('draft','published','retracted')),
  responsibility_accepted BOOLEAN NOT NULL DEFAULT FALSE,
  responsibility_accepted_at TIMESTAMP NULL,
  published_at TIMESTAMP NULL,
  retracted_at TIMESTAMP NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

Indexes:
```sql
CREATE UNIQUE INDEX uq_provider_weekly_active_question
ON provider_weekly_questions(provider_id, week_start_date)
WHERE status = 'active';

CREATE INDEX idx_provider_questions_history
ON provider_weekly_questions(provider_id, template_id);

CREATE INDEX idx_profile_published_answers
ON experience_answers(profile_id, status, published_at DESC);
```
