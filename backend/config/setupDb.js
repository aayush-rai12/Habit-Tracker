import db from './db.js';

db.serialize(() => {
  // Users Table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      firstName TEXT NOT NULL,
      lastName TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Habits Table
  db.run(`
    CREATE TABLE IF NOT EXISTS habits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      startDate TEXT NOT NULL,
      endDate TEXT,                     
      goal INTEGER DEFAULT 1,           
      frequency TEXT DEFAULT 'DAILY',   
      color TEXT DEFAULT '#E0E7FF',     
      status TEXT DEFAULT 'ACTIVE',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
    // Labels Table
  db.run(`
    CREATE TABLE IF NOT EXISTS labels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      name TEXT NOT NULL,
      color TEXT DEFAULT '#3B82F6',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(userId, name),
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Habit_Labels Table 
  db.run(`
    CREATE TABLE IF NOT EXISTS habit_labels (
      habitId INTEGER NOT NULL,
      labelId INTEGER NOT NULL,
      PRIMARY KEY (habitId, labelId),
      FOREIGN KEY (habitId) REFERENCES habits(id) ON DELETE CASCADE,
      FOREIGN KEY (labelId) REFERENCES labels(id) ON DELETE CASCADE
    )
  `);

  // Completions Table
  db.run(`
    CREATE TABLE IF NOT EXISTS completions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      habitId INTEGER NOT NULL,
      date TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (habitId) REFERENCES habits(id) ON DELETE CASCADE,
      UNIQUE(habitId, date)
    )
  `);

  console.log('Database tables created successfully.');
});