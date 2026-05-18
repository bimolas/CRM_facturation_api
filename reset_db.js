const mysql = require('mysql2/promise');

const host = process.env.DB_HOST ?? 'localhost';
const port = Number(process.env.DB_PORT ?? 3306);
const user = process.env.DB_USERNAME ?? 'root';
const password = process.env.DB_PASSWORD ?? '1002';
const database = process.env.DB_DATABASE ?? 'crm_facturation';

async function main() {
  console.log(`Connecting to database ${database} at ${host}:${port}...`);
  const connection = await mysql.createConnection({
    host,
    port,
    user,
    password,
    database
  });

  try {
    console.log('Disabling foreign key checks...');
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');

    // Get all tables
    const [rows] = await connection.query('SHOW TABLES');
    const tables = rows.map(row => Object.values(row)[0]);

    if (tables.length === 0) {
      console.log('No tables found to drop.');
    } else {
      console.log(`Found tables: ${tables.join(', ')}`);
      for (const table of tables) {
        console.log(`Dropping table ${table}...`);
        await connection.query(`DROP TABLE IF EXISTS \`${table}\``);
      }
      console.log('All tables dropped successfully.');
    }

    console.log('Enabling foreign key checks...');
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');
  } catch (error) {
    console.error('Error occurred:', error);
  } finally {
    await connection.end();
  }
}

main().catch(console.error);
