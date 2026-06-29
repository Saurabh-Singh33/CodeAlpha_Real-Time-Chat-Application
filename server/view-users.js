const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Connect to the SQLite database where users are saved
const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    return;
  }
  
  console.log(`\nConnected to the database at:\n=> ${dbPath}\n`);
  
  // Query to get all names (and encrypted passwords) from the users table
  db.all(`SELECT id, username, password FROM users`, [], (err, rows) => {
    if (err) {
      throw err;
    }
    
    if (rows.length === 0) {
      console.log('No users have registered yet!');
    } else {
      console.log('--- REGISTERED USERS ---');
      console.table(rows);
      console.log('------------------------\n');
      console.log('Notice how the "password" field is just a scrambled hash (bcrypt) rather than the real password!');
    }
    
    // Close the database connection
    db.close();
  });
});
