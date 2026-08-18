import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://dnpfcynmyxgzmhjzuuzx.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_hq07ZB4vteW_COwukrcbaw_y4NGWeFn";

console.log("Supabase URL loaded:", supabaseUrl); // Should show your https://... URL

export const supabase = createClient(supabaseUrl, supabaseAnonKey);