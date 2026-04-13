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
        console.log('1. Fixing RLS for invoices...');
        await pool.query('ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;');
        
        // Drop existing to avoid duplication conflicts
        await pool.query('DROP POLICY IF EXISTS "Users can insert their own invoices" ON invoices;');
        await pool.query('DROP POLICY IF EXISTS "Users can view their own invoices" ON invoices;');
        await pool.query('DROP POLICY IF EXISTS "Users can update their own invoices" ON invoices;');
        await pool.query('DROP POLICY IF EXISTS "Users can delete their own invoices" ON invoices;');
        
        // Add policies using auth.uid()
        await pool.query(`CREATE POLICY "Users can insert their own invoices" ON invoices FOR INSERT WITH CHECK (user_id = auth.uid());`);
        await pool.query(`CREATE POLICY "Users can view their own invoices" ON invoices FOR SELECT USING (user_id = auth.uid());`);
        await pool.query(`CREATE POLICY "Users can update their own invoices" ON invoices FOR UPDATE USING (user_id = auth.uid());`);
        await pool.query(`CREATE POLICY "Users can delete their own invoices" ON invoices FOR DELETE USING (user_id = auth.uid());`);
        
        console.log('2. Fixing RLS for users...');
        await pool.query('ALTER TABLE users ENABLE ROW LEVEL SECURITY;');
        
        await pool.query('DROP POLICY IF EXISTS "Users can view their own profile" ON users;');
        await pool.query('DROP POLICY IF EXISTS "Users can update their own profile" ON users;');
        
        await pool.query(`CREATE POLICY "Users can view their own profile" ON users FOR SELECT USING (id = auth.uid());`);
        await pool.query(`CREATE POLICY "Users can update their own profile" ON users FOR UPDATE USING (id = auth.uid());`);

        console.log('Done! Database RLS fix complete.');
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await pool.end();
    }
}

run();
