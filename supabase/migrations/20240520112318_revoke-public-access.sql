alter default privileges in schema public revoke all on functions from anon;
alter default privileges in schema public revoke all on functions from authenticated;
alter default privileges in schema public revoke all on sequences from anon;
alter default privileges in schema public revoke all on sequences from authenticated;
alter default privileges in schema public revoke all on tables from anon;
alter default privileges in schema public revoke all on tables from authenticated;
alter default privileges in schema storage revoke all on functions from anon;
alter default privileges in schema storage revoke all on functions from authenticated;
alter default privileges in schema storage revoke all on sequences from anon;
alter default privileges in schema storage revoke all on sequences from authenticated;
alter default privileges in schema storage revoke all on tables from anon;
alter default privileges in schema storage revoke all on tables from authenticated;

REVOKE ALL ON ALL ROUTINES IN SCHEMA public FROM PUBLIC;
REVOKE ALL ON ALL ROUTINES IN SCHEMA storage FROM PUBLIC;
GRANT ALL ON SCHEMA public TO "service_role";
GRANT ALL ON ALL ROUTINES IN SCHEMA storage TO "service_role";

REVOKE ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA "public" FROM "anon";
REVOKE ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA "public" FROM "authenticated";
REVOKE ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA "storage" FROM "anon";
REVOKE ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA "storage" FROM "authenticated";
REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA "public" FROM "anon";
REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA "public" FROM "authenticated";
REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA "storage" FROM "anon";
REVOKE ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA "storage" FROM "authenticated";
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA "public" FROM "anon";
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA "public" FROM "authenticated";
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA "storage" FROM "anon";
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA "storage" FROM "authenticated";
REVOKE ALL PRIVILEGES ON DATABASE "postgres" FROM "anon";
REVOKE ALL PRIVILEGES ON DATABASE "postgres" FROM "authenticated";
REVOKE ALL PRIVILEGES ON SCHEMA "public" FROM "anon";
REVOKE ALL PRIVILEGES ON SCHEMA "public" FROM "authenticated";
REVOKE ALL PRIVILEGES ON SCHEMA "storage" FROM "anon";
REVOKE ALL PRIVILEGES ON SCHEMA "storage" FROM "authenticated";
revoke execute on all functions in schema public from anon;
revoke execute on all functions in schema public from authenticated;
revoke execute on all functions in schema storage from anon;
revoke execute on all functions in schema storage from authenticated;
revoke select on all tables in schema public from anon;
revoke select on all tables in schema public from authenticated;
revoke select on all tables in schema storage from anon;
revoke select on all tables in schema storage from authenticated;
revoke usage on all sequences in schema public from anon;
revoke usage on all sequences in schema public from authenticated;
revoke usage on all sequences in schema storage from anon;
revoke usage on all sequences in schema storage from authenticated;
revoke usage on schema public from anon;
revoke usage on schema public from authenticated;
revoke usage on schema storage from anon;
revoke usage on schema storage from authenticated;


ALTER ROLE anon SET pgrst.openapi_mode TO 'disabled';
ALTER ROLE authenticated SET pgrst.openapi_mode TO 'disabled';
NOTIFY pgrst, 'reload config'
