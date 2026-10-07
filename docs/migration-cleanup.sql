-- Выполнить ОДИН РАЗ в Supabase → SQL Editor после обновления бэкенда.
-- Обязательно двумя отдельными запусками (каждый блок — отдельное нажатие Run),
-- иначе Postgres может отказаться использовать новое значение enum в той же транзакции.

-- Шаг 1: выполнить и нажать Run
alter type report_status add value if not exists 'resolved';

-- Шаг 2: после шага 1 выполнить отдельно и нажать Run
alter table reports add column if not exists resolved_at timestamptz;

-- Таблицу cleanup_submissions создавать не нужно — бэкенд создаст её сам при старте.
