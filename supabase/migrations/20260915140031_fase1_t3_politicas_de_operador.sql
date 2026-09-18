-- El operador (Quique) ve todo. Sigue sin poder ESCRIBIR nada desde el
-- navegador: para mover un envio existe un RPC acotado.
-- (select public.es_operador()) va entre parentesis para que Postgres lo
-- evalue una vez por consulta y no una vez por renglon.

create policy "quotes: el operador ve todas"
  on public.quotes for select
  using ((select public.es_operador()));

create policy "shipments: el operador ve todos"
  on public.shipments for select
  using ((select public.es_operador()));

create policy "invoices: el operador ve todas"
  on public.invoices for select
  using ((select public.es_operador()));

create policy "tickets: el operador ve todos"
  on public.tickets for select
  using ((select public.es_operador()));

create policy "ticket_messages: el operador ve todos"
  on public.ticket_messages for select
  using ((select public.es_operador()));

create policy "profiles: el operador ve todos"
  on public.profiles for select
  using ((select public.es_operador()));
