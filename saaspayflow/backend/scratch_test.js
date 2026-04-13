import pg from 'pg';
const passwords = ['Priyanka@050803.', 'Priyanka@050803./'];
async function test() {
  for (const pwd of passwords) {
    const url = `postgresql://postgres:${encodeURIComponent(pwd)}@db.fhhfcrqbothnlsyifryg.supabase.co:5432/postgres?sslmode=require`;
    const pool = new pg.Pool({ connectionString: url });
    try {
      const client = await pool.connect();
      console.log('SUCCESS with password:', pwd);
      client.release();
      process.exit(0);
    } catch (e) {
      console.log('FAILED with password:', pwd, 'Error:', e.message);
    }
    await pool.end();
  }
}
test();
