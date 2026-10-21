-- Let the AI suggest new labels, not only the five default ones.
--
-- 1_init_tasks.sql allowed only 'work', 'personal', 'priority', 'shopping' and
-- 'home'. Postgres named that check constraint tasks_label_check.
alter table public.tasks drop constraint if exists tasks_label_check;

-- A label must still be short and tidy: lowercase letters and digits, with words
-- separated by one space or hyphen, at most 20 characters. The Edge Function
-- create-task-with-ai checks the same rules (supabase/functions/_shared/labelRules.ts)
-- before it saves a label. A task can still have no label (null).
alter table public.tasks add constraint tasks_label_format_check
  check (char_length(label) <= 20 and label ~ '^[a-z0-9]+([ -][a-z0-9]+)*$');
