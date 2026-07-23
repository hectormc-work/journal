 -- File: upgrade.sql
 -- Version: task#d5254c
 -- Parents: add-entry-name#3937c5

CREATE TABLE task (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    text text NOT NULL,
    done_date date,
    created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON COLUMN task.done_date IS
    'NULL = not done, else the day it was done.';
