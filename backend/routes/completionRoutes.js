import express from 'express';
import db from '../config/db.js';
import crypto from 'crypto';
import authenticateToken from '../middleware/auth.js';

const router = express.Router({ mergeParams: true });

router.use(authenticateToken);

// GET completions (range)
router.get('/', (req, res) => {
  const userId = req.user.id;
  const habitId = req.params.id;
  const { from, to } = req.query;

  db.get('SELECT * FROM habits WHERE id = ? AND userId = ?', [habitId, userId], (err, habit) => {
    if (err || !habit) return res.status(404).json({ error: { message: 'Habit not found.' } });

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

// PUT completion (idempotent, no duplicates)
router.put('/:date', (req, res) => {
  const userId = req.user.id;
  const habitId = req.params.id;
  const date = req.params.date;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: { message: 'Date must be YYYY-MM-DD.' } });
  }

  db.get('SELECT * FROM habits WHERE id = ? AND userId = ?', [habitId, userId], (err, habit) => {
    if (err || !habit) return res.status(404).json({ error: { message: 'Habit not found.' } });

    const completionId = crypto.randomUUID();
    db.run(
      'INSERT INTO completions (id, habitId, date) VALUES (?, ?, ?)',
      [completionId, habitId, date],
      function (err) {
        if (err) {
          if (err.message.includes('UNIQUE')) {
            return res.status(200).json({ message: 'Already completed for this date.' });
          }
          return res.status(500).json({ error: { message: 'Failed.' } });
        }
        res.status(201).json({ message: 'Habit completed', completionId });
      }
    );
  });
});

// DELETE completion (undo)
router.delete('/:date', (req, res) => {
  const userId = req.user.id;
  const habitId = req.params.id;
  const date = req.params.date;

  db.get('SELECT * FROM habits WHERE id = ? AND userId = ?', [habitId, userId], (err, habit) => {
    if (err || !habit) return res.status(404).json({ error: { message: 'Habit not found.' } });

    db.run('DELETE FROM completions WHERE habitId = ? AND date = ?', [habitId, date], function (err) {
      if (err) return res.status(500).json({ error: { message: 'Failed.' } });
      if (this.changes === 0) return res.status(404).json({ error: { message: 'Not found.' } });
      res.json({ message: 'Completion undone' });
    });
  });
});

export default router;