import pg from 'pg';

const regions = [
  'aws-0-us-east-1',
  'aws-0-us-west-1',
  'aws-0-eu-central-1',
  'aws-0-eu-west-1',
  'aws-0-eu-west-2',
  'aws-0-ap-southeast-1',
  'aws-0-ap-northeast-1',
  'aws-0-ap-south-1',
  'aws-0-sa-east-1',
  'aws-0-ap-southeast-2'
];

async function testAllRegions() {
  console.log('Starting automated detection of your Supabase database region...');
  const password = encodeURIComponent('KPriyanka@050803./');
  const projectId = 'fhhfcrqbothnlsyifryg';

  for (const region of regions) {
    const host = `${region}.pooler.supabase.com`;
    const connectionString = `postgresql://postgres.${projectId}:${password}@${host}:6543/postgres?sslmode=require`;
    
    // We set connection timeout to 3 seconds so we cycle through fast
    const pool = new pg.Pool({ connectionString, connectionTimeoutMillis: 3000 });
    
    try {
      const client = await pool.connect();
      console.log(`\n✅ SUCCESS! Found your database in region: ${region}`);
      console.log(`Your Pooler Connection String is: \n${connectionString}\n`);
      client.release();
      process.exit(0);
    } catch (e) {
      process.stdout.write('.');
    } finally {
      await pool.end();
    }
  }
  console.log('\n❌ Could not find the database. Are you sure the password is correct?');
}

testAllRegions();
