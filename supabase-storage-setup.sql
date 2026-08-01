-- Ejecuta una sola vez en Supabase: SQL Editor > New query > Run.
-- Después copia la clave Publishable/anon en index.html.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'fotos-reportes',
  'fotos-reportes',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
on conflict (id) do nothing;

-- Desarrollo: permite que la app actual, que inicia sesión con Firebase,
-- suba y lea imágenes. Para producción, migra el inicio de sesión a
-- Supabase Auth y restringe estas políticas a usuarios autenticados.
create policy "Lectura pública de fotos de reportes"
on storage.objects for select
to anon
using (bucket_id = 'fotos-reportes');

create policy "Subida temporal de fotos de reportes"
on storage.objects for insert
to anon
with check (bucket_id = 'fotos-reportes');

-- Un bucket publico ya sirve cada imagen mediante su URL publica. No se debe
-- crear una politica SELECT amplia porque permitiria listar todo el contenido.
do $$
declare policy_record record;
begin
  for policy_record in
    select policyname
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and cmd = 'SELECT'
      and qual = '(bucket_id = ''fotos-reportes''::text)'
  loop
    execute format('drop policy %I on storage.objects', policy_record.policyname);
  end loop;
end $$;
