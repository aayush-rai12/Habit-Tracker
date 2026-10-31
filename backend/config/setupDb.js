import db from './db.js';

db.serialize(() => {
  // Users Table for storing user Details
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      firstName TEXT NOT NULL,
      lastName TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Habits Table to store user habits
  db.run(`
    CREATE TABLE IF NOT EXISTS habits (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
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

  // Labels Table to categorize habits
  db.run(`
    CREATE TABLE IF NOT EXISTS labels (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      name TEXT NOT NULL,
      color TEXT DEFAULT '#3B82F6',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  //Habit_Labels Table (Many-to-Many relation kyunki ek habit ke multiple labels ho sakte hain)
  db.run(`
    CREATE TABLE IF NOT EXISTS habit_labels (
      habitId TEXT NOT NULL,
      labelId TEXT NOT NULL,
      PRIMARY KEY (habitId, labelId),
      FOREIGN KEY (habitId) REFERENCES habits(id) ON DELETE CASCADE,
      FOREIGN KEY (labelId) REFERENCES labels(id) ON DELETE CASCADE
    )
  `);

  //Completions Table to track when a habit is completed on a specific date
  db.run(`
    CREATE TABLE IF NOT EXISTS completions (
      id TEXT PRIMARY KEY,
      habitId TEXT NOT NULL,
      date TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (habitId) REFERENCES habits(id) ON DELETE CASCADE,
      UNIQUE(habitId, date)
    )
  `);

  console.log('Database tables created successfully.');
});