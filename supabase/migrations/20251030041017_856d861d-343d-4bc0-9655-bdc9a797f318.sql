-- Add title field to chart_analyses
ALTER TABLE public.chart_analyses
ADD COLUMN title text;

-- Update RLS policies for chart_analyses to allow admins full access
CREATE POLICY "Admins can view all analyses"
ON public.chart_analyses
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete analyses"
ON public.chart_analyses
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can delete their own analyses"
ON public.chart_analyses
FOR DELETE
USING (auth.uid() = user_id);