import express from 'express';
import db from '../config/db.js';
import crypto from 'crypto';
import authenticateToken from '../middleware/auth.js';

const router = express.Router();

// Middleware to authenticate JWT token for all habit routes
router.use(authenticateToken);

//CREATE HABIT 
router.post('/', (req, res) => {
  const { name, description, startDate, endDate, goal, frequency, color } = req.body;
  const userId = req.user.id; // JWT se aaya hua user ID

  if (!name || !startDate) {
    return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Name and startDate are required.' } });
  }

  const habitId = crypto.randomUUID();
  const sql = `INSERT INTO habits (id, userId, name, description, startDate, endDate, goal, frequency, color) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
  
  db.run(sql, [habitId, userId, name, description || null, startDate, endDate || null, goal || 1, frequency || 'DAILY', color || '#E0E7FF'], function(err) {
    if (err) return res.status(500).json({ error: { message: 'Failed to create habit.' } });
    res.status(201).json({ message: 'Habit created', habitId });
  });
});

// GET ALL HABITS (Filter by status)
router.get('/', (req, res) => {
  const { status = 'ACTIVE' } = req.query;
  const userId = req.user.id;

  db.all('SELECT * FROM habits WHERE userId = ? AND status = ? ORDER BY createdAt DESC', [userId, status], (err, habits) => {
    if (err) return res.status(500).json({ error: { message: 'Database error.' } });
    res.json(habits);
  });
});

// GET SINGLE HABIT
router.get('/:id', (req, res) => {
  const userId = req.user.id;
  db.get('SELECT * FROM habits WHERE id = ? AND userId = ?', [req.params.id, userId], (err, habit) => {
    if (err) return res.status(500).json({ error: { message: 'Database error.' } });
    if (!habit) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Habit not found.' } });
    res.json(habit);
  });
});

// UPDATE HABIT
router.patch('/:id', (req, res) => {
  const userId = req.user.id;
  const { name, description, endDate, goal, frequency, color } = req.body;

  db.get('SELECT * FROM habits WHERE id = ? AND userId = ?', [req.params.id, userId], (err, habit) => {
    if (err || !habit) return res.status(404).json({ error: { message: 'Habit not found.' } });

    const updatedName = name || habit.name;
    const updatedDesc = description !== undefined ? description : habit.description;
    const updatedEndDate = endDate !== undefined ? endDate : habit.endDate;
    const updatedGoal = goal !== undefined ? goal : habit.goal;
    const updatedFreq = frequency || habit.frequency;
    const updatedColor = color || habit.color;

    db.run(
      `UPDATE habits SET name = ?, description = ?, endDate = ?, goal = ?, frequency = ?, color = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ? AND userId = ?`,
      [updatedName, updatedDesc, updatedEndDate, updatedGoal, updatedFreq, updatedColor, req.params.id, userId],
      function(err) {
        if (err) return res.status(500).json({ error: { message: 'Update failed.' } });
        res.json({ message: 'Habit updated' });
      }
    );
  });
});

// ARCHIVE HABIT
router.post('/:id/archive', (req, res) => {
  const userId = req.user.id;
  db.run('UPDATE habits SET status = "ARCHIVED" WHERE id = ? AND userId = ?', [req.params.id, userId], function(err) {
    if (err) return res.status(500).json({ error: { message: 'Failed to archive.' } });
    if (this.changes === 0) return res.status(404).json({ error: { message: 'Habit not found.' } });
    res.json({ message: 'Habit archived' });
  });
});

// DELETE HABIT (I'm not deleting completely - just i add Soft Delete and add status - Trash)
router.delete('/:id', (req, res) => {
  const userId = req.user.id;
  db.run('UPDATE habits SET status = "TRASHED" WHERE id = ? AND userId = ?', [req.params.id, userId], function(err) {
    if (err) return res.status(500).json({ error: { message: 'Failed to delete.' } });
    if (this.changes === 0) return res.status(404).json({ error: { message: 'Habit not found or unauthorized.' } });
    res.json({ message: 'Habit moved to trash' });
  });
});

export default router;