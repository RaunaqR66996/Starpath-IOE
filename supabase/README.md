# Supabase Setup

## Running Locally

1. Install Supabase CLI.
2. Run `supabase start`.
3. The migrations in `migrations/` will be applied automatically.
4. Apply the seed data:
   ```bash
   psql -h localhost -p 54322 -U postgres -d postgres -f seed.sql
   ```
   (Or use `supabase db reset` which applies seed.sql if placed in helper folder, or just manually run it).

## RLS
RLS is enabled. To test, you must sign in to the dashboard or app. The seed data creates an Org `Blue Ship Manufacturing`.
When you sign up a user, manually add them to `users_orgs` to give access:
```sql
insert into users_orgs (user_id, org_id) values ('YOUR_USER_ID', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');
```
