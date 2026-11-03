import express from 'express';
import db from '../config/db.js';
import authenticateToken from '../middleware/auth.js';

const router = express.Router({ mergeParams: true });
router.use(authenticateToken);

const isValidDate = (value) => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

// GET completions (filtered by date range)
router.get('/', (req, res) => {
  const userId = req.user.id;
  const habitId = req.params.id;
  const { from, to } = req.query;

  if ((from && !isValidDate(from)) || (to && !isValidDate(to)) || (from && to && from > to)) {
    return res.status(400).json({ error: { message: 'Date filters must be valid YYYY-MM-DD values with from on or before to.' } });
  }

  db.get('SELECT * FROM habits WHERE id = ? AND userId = ?', [habitId, userId], (err, habit) => {
    if (err) return res.status(500).json({ error: { message: 'Database error.' } });
    if (!habit) return res.status(404).json({ error: { message: 'Habit not found.' } });

    let sql = 'SELECT * FROM completions WHERE habitId = ?';
    const params = [habitId];
    if (from) { sql += ' AND date >= ?'; params.push(from); }
    if (to) { sql += ' AND date <= ?'; params.push(to); }
    sql += ' ORDER BY date ASC';

    db.all(sql, params, (err, rows) => {
      if (err) return res.status(500).json({ error: { message: 'Database error.' } });
      res.json(rows);
    });
  });
});

// MARK COMPLETE (PUT - idempotent)
router.put('/:date', (req, res) => {
  const userId = req.user.id;
  const habitId = req.params.id;
  const date = req.params.date;

  if (!isValidDate(date)) {
    return res.status(400).json({ error: { message: 'Date must be YYYY-MM-DD.' } });
  }

  db.get('SELECT * FROM habits WHERE id = ? AND userId = ?', [habitId, userId], (err, habit) => {
    if (err) return res.status(500).json({ error: { message: 'Database error.' } });
    if (!habit) return res.status(404).json({ error: { message: 'Habit not found.' } });
    if (habit.status !== 'ACTIVE') {
      return res.status(409).json({ error: { message: 'Only active habits can be marked complete.' } });
    }
    if (date < habit.startDate || (habit.endDate && date > habit.endDate)) {
      return res.status(400).json({ error: { message: 'Completion date must fall within the habit dates.' } });
    }

    db.run(
      'INSERT INTO completions (habitId, date) VALUES (?, ?)',
      [habitId, date],
      function (err) {
        if (err) {
          if (err.message.includes('UNIQUE')) {
            return res.status(200).json({ message: 'Already completed for this date.' });
          }
          return res.status(500).json({ error: { message: 'Failed to complete.' } });
        }
        res.status(201).json({ message: 'Habit completed', completionId: this.lastID });
      }
    );
  });
});

// UNDO COMPLETE (DELETE)
router.delete('/:date', (req, res) => {
  const userId = req.user.id;
  const habitId = req.params.id;
  const date = req.params.date;

  if (!isValidDate(date)) {
    return res.status(400).json({ error: { message: 'Date must be YYYY-MM-DD.' } });
  }

  db.get('SELECT * FROM habits WHERE id = ? AND userId = ?', [habitId, userId], (err, habit) => {
    if (err) return res.status(500).json({ error: { message: 'Database error.' } });
    if (!habit) return res.status(404).json({ error: { message: 'Habit not found.' } });

    db.run('DELETE FROM completions WHERE habitId = ? AND date = ?', [habitId, date], function (err) {
      if (err) return res.status(500).json({ error: { message: 'Failed to undo.' } });
      if (this.changes === 0) return res.status(404).json({ error: { message: 'Completion not found.' } });
      res.json({ message: 'Completion undone' });
    });
  });
});

export default router;