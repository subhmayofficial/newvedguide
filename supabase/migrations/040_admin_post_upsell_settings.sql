create table if not exists public.admin_post_upsell_settings (
  id integer primary key,
  message_1_template text not null default '',
  message_2_template text not null default '',
  updated_at timestamptz not null default now()
);

insert into public.admin_post_upsell_settings (
  id,
  message_1_template,
  message_2_template
)
values (
  1,
  'Namaste {{name}} ji, aapki kundli me ye dosh/points aaye hain: {{points}}. Agar aap chahein to next upay ke liye hum guide kar sakte hain.',
  'Follow-up {{name}} ji, 24 ghante pehle share kiye gaye kundli points: {{points}}. Agar aap ready hain to hum agla step start kar dete hain.'
)
on conflict (id) do nothing;
