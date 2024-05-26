import { createClient } from '@supabase/supabase-js';
import { supabase as config } from './config';

export const supabase = createClient(config.url, config.key);
