
GRANT INSERT, UPDATE ON public.subscribers TO authenticated;

CREATE POLICY "Users can insert own subscription"
  ON public.subscribers FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription"
  ON public.subscribers FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
