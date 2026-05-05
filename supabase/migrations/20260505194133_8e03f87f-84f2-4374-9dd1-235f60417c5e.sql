
-- Create mention_folders table
CREATE TABLE public.mention_folders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#C41230',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.mention_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own folders"
ON public.mention_folders FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own folders"
ON public.mention_folders FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own folders"
ON public.mention_folders FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own folders"
ON public.mention_folders FOR DELETE
USING (auth.uid() = user_id);

CREATE TRIGGER update_mention_folders_updated_at
BEFORE UPDATE ON public.mention_folders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add folder_id to mentions table
ALTER TABLE public.mentions
ADD COLUMN folder_id UUID REFERENCES public.mention_folders(id) ON DELETE SET NULL;
