 -- File: upgrade.sql
 -- Version: entry-date-unique#35c4a9
 -- Parents: task#d5254c

ALTER TABLE entry ADD CONSTRAINT entry_entry_date_unique UNIQUE (entry_date);

COMMENT ON CONSTRAINT entry_entry_date_unique ON entry IS
    'Highly useful for implicit task/bucket-list link.';
