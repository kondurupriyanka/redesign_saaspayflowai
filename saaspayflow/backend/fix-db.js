import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        console.log('1. Fixing invoice schema...');
        await pool.query('ALTER TABLE invoices ADD COLUMN IF NOT EXISTS title text');
        await pool.query('ALTER TABLE invoices ADD COLUMN IF NOT EXISTS subtotal numeric(12,2)');
        await pool.query('ALTER TABLE invoices ADD COLUMN IF NOT EXISTS tax numeric(12,2)');
        await pool.query('ALTER TABLE invoices ADD COLUMN IF NOT EXISTS total numeric(12,2)');
        console.log('   -> Added title, subtotal, tax, total to invoices.');
        
        console.log('2. Fixing storage buckets (avatars)...');
        await pool.query(`INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO UPDATE SET public = true;`);
        
        // RLS for storage.objects
        console.log('3. Setting up RLS for avatars bucket...');
        await pool.query(`DROP POLICY IF EXISTS "Avatar Images are Public" ON storage.objects;`);
        await pool.query(`DROP POLICY IF EXISTS "Users can upload an avatar" ON storage.objects;`);
        await pool.query(`DROP POLICY IF EXISTS "Users can update an avatar" ON storage.objects;`);

        await pool.query(`CREATE POLICY "Avatar Images are Public" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');`);
        
        // Use auth.uid() function from Supabase
        await pool.query(`CREATE POLICY "Users can upload an avatar" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = owner::text);`);
        await pool.query(`CREATE POLICY "Users can update an avatar" ON storage.objects FOR UPDATE WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = owner::text);`);
        
        console.log('   -> Avatars bucket set up successfully with RLS.');
        
        console.log('Done! Database fix complete.');
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await pool.end();
    }
}

run();
