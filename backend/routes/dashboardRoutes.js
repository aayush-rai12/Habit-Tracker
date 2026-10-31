import express from 'express';
import db from '../config/db.js';
import authenticateToken from '../middleware/auth.js';

const router = express.Router();
router.use(authenticateToken);

router.get('/stats', (req, res) => {
  const userId = req.user.id;
  const { from, to } = req.query;

  // Default- last 7 days
  const today = new Date();
  const defaultTo = today.toISOString().slice(0, 10);
  const defaultFromDate = new Date(today);
  defaultFromDate.setDate(defaultFromDate.getDate() - 6);
  const defaultFrom = defaultFromDate.toISOString().slice(0, 10);

  const periodStart = from || defaultFrom;
  const periodEnd = to || defaultTo;

  // Active habits count
  db.get(
    'SELECT COUNT(*) as count FROM habits WHERE userId = ? AND status = "ACTIVE"',
    [userId],
    (err, activeRow) => {
      if (err) return res.status(500).json({ error: { message: 'DB error.' } });
      const activeHabits = activeRow.count;

      // Completions in period
      db.get(
        `SELECT COUNT(*) as count FROM completions c
         JOIN habits h ON c.habitId = h.id
         WHERE h.userId = ? AND h.status = 'ACTIVE'
         AND c.date >= ? AND c.date <= ?`,
        [userId, periodStart, periodEnd],
        (err, compRow) => {
          if (err) return res.status(500).json({ error: { message: 'DB error.' } });

          // Expected completions = active habits × days in period
          const start = new Date(periodStart);
          const end = new Date(periodEnd);
          const days = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
          const expected = activeHabits * days;

          const completed = compRow.count;
          const rate = expected > 0 ? Math.round((completed / expected) * 100) : 0;

          res.json({
            period: { from: periodStart, to: periodEnd, days },
            activeHabits,
            totalCompletions: completed,
            expectedCompletions: expected,
            completionRate: rate, // percentage
            denominatorNote: 'activeHabits × days in period (excluding archived/trashed)',
          });
        }
      );
    }
  );
});

export default router;