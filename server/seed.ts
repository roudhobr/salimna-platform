import { db, initDatabase, seedInitialData } from './db.js';

console.log('🔄 Resetting database tables...');
db.exec(`
  DROP TABLE IF EXISTS products;
  DROP TABLE IF EXISTS articles;
  DROP TABLE IF EXISTS orders;
  DROP TABLE IF EXISTS inquiries;
`);

initDatabase();
console.log('🎉 Database successfully re-seeded with fresh data!');
