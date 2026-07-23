 -- File: upgrade.sql
 -- Version: initial-schema#a138b4
 -- Parents: root#000000

CREATE TABLE prompt_group (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text
);

CREATE TABLE prompt (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id uuid NOT NULL REFERENCES prompt_group (id),
    position integer NOT NULL,
    text text NOT NULL,
    archived boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON COLUMN prompt.group_id IS
    'Every prompt belongs to exactly one group -- there are no standalone prompts. Entries only ever gain prompts by adding a whole group.';
COMMENT ON COLUMN prompt.position IS
    'Ordering of this prompt within its group.';

CREATE TABLE entry (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_date date NOT NULL,
    body text,
    created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON COLUMN entry.body IS
    'The main journaling text for this day, independent of any attached prompts. An entry with zero attached prompts is still fully journal-able via this field alone.';
COMMENT ON COLUMN entry.entry_date IS
    'A civil/wall-clock date, not an instant -- the client sends its local date and it is stored literally, with no timezone conversion.';

CREATE TABLE recording (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_id uuid NOT NULL REFERENCES entry (id) ON DELETE CASCADE,
    path text NOT NULL,
    mime_type text NOT NULL,
    duration_ms integer NOT NULL,
    size_bytes bigint NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE prompt_response (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_id uuid NOT NULL REFERENCES entry (id) ON DELETE CASCADE,
    prompt_text text NOT NULL,
    response text,
    created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE prompt_response IS
    'One row per prompt attached to an entry (via adding its group). Created up front with response = NULL when a group is added; answered independently and asynchronously after that.';
COMMENT ON COLUMN prompt_response.prompt_text IS
    'A frozen snapshot of the prompt''s wording at the time it was attached to this entry -- not a reference to the prompt row. Keeps past responses stable if a prompt''s wording is edited later, and means deleting a prompt is never blocked by existing responses.';
COMMENT ON COLUMN prompt_response.response IS
    'NULL until answered -- attaching a group''s prompts to an entry does not require responding to them immediately.';
