import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rbpdeuvgikavhnzqwfmr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJicGRldXZnaWthdmhuenF3Zm1yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzMDY2MzIsImV4cCI6MjA2Mzg4MjYzMn0.YaxtWO6ZDK-q-_C2ge3Gcyycn4_HsdiAGND7mx-9A0E';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);