\set ON_ERROR_STOP on

-- Manual bootstrap helper. release.sh normally provisions the role/database
-- and stores the generated password only in /opt/token-meter/shared/.env.
-- Usage as postgres:
--   psql -v token_meter_password='<generated-secret>' -f ops/bootstrap.sql

SELECT format(
  'CREATE ROLE token_meter LOGIN PASSWORD %L',
  :'token_meter_password'
)
WHERE NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'token_meter')
\gexec

SELECT 'CREATE DATABASE token_meter OWNER token_meter'
WHERE NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'token_meter')
\gexec