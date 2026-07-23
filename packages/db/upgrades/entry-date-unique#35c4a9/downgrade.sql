 -- File: downgrade.sql
 -- Version: entry-date-unique#35c4a9
 -- Parents: task#d5254c

ALTER TABLE entry DROP CONSTRAINT entry_entry_date_unique;
