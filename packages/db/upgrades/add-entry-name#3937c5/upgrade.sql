 -- File: upgrade.sql
 -- Version: add-entry-name#3937c5
 -- Parents: initial-schema#a138b4

 -- TODO: Implement upgrade for add-entry-name#3937c5

ALTER TABLE entry ADD COLUMN name text NOT NULL;

COMMENT ON COLUMN entry.name IS
    'Short label for the entry, editable independently of body. Always set by the application -- defaults to a formatted date when not explicitly provided at creation.';
