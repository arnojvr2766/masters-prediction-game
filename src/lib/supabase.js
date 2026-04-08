import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://lqordpqmarsanqosimcc.supabase.co'
const SUPABASE_ANON_KEY = 'sb_publishable_bn0kIfFeL_wfNFdAgjN75g_LMdYkhUE'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
