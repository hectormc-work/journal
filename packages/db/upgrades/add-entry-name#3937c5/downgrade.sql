 -- File: downgrade.sql
 -- Version: add-entry-name#3937c5
 -- Parents: initial-schema#a138b4

 -- TODO: Implement downgrade for add-entry-name#3937c5

ALTER TABLE entry DROP COLUMN name;
