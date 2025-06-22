-- 1. Drop old triggers if they exist
drop function if exists public.handle_new_user cascade;
drop function if exists public.sync_role_claim cascade;

-- 2. Recreate sync_role_claim helper
create or replace function public.sync_role_claim()
returns trigger as $$
begin
  update auth.users
  set raw_app_meta_data = 
    case 
      when raw_app_meta_data is null then jsonb_build_object('role', new.role)
      else jsonb_set(raw_app_meta_data, '{role}', to_jsonb(new.role))
    end
  where id = new.id;

  return new;
end;
$$ language plpgsql security definer;

-- 3. Recreate handle_new_user trigger
create or replace function public.handle_new_user()
returns trigger as $$
declare
  default_role text := 'member';
  user_email text := new.email;
begin
  -- Set default role in public.users
  insert into public.users (id, email, full_name, role, is_active, created_at, updated_at)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', 'New User'),
    coalesce(new.raw_user_meta_data->>'role', default_role),
    true,
    now(),
    now()
  )
  on conflict (id) do nothing;

  -- Sync to raw_app_meta_data
  perform public.sync_role_claim();

  return new;
end;
$$ language plpgsql security definer;

-- 4. Create trigger on auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();