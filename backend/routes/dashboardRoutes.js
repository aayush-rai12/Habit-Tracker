import express from 'express';
import db from '../config/db.js';
import authenticateToken from '../middleware/auth.js';

const router = express.Router();
router.use(authenticateToken);

const isValidDate = (value) => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

router.get('/stats', (req, res) => {
  const userId = req.user.id;
  const { from, to } = req.query;

  // Default: last 7 days
  const today = new Date();
  const defaultTo = today.toISOString().slice(0, 10);
  const defaultFromDate = new Date(today);
  defaultFromDate.setDate(defaultFromDate.getDate() - 6);
  const defaultFrom = defaultFromDate.toISOString().slice(0, 10);

  const periodStart = from || defaultFrom;
  const periodEnd = to || defaultTo;
  if (!isValidDate(periodStart) || !isValidDate(periodEnd) || periodStart > periodEnd) {
    return res.status(400).json({ error: { message: 'Provide a valid date range using YYYY-MM-DD, with from on or before to.' } });
  }

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

          const completed = compRow.count;
          const start = new Date(`${periodStart}T00:00:00.000Z`);
          const end = new Date(`${periodEnd}T00:00:00.000Z`);
          const days = Math.floor((end - start) / 86400000) + 1;
          const expectedCompletions = activeHabits * days;

          res.json({
            period: { from: periodStart, to: periodEnd, days },
            activeHabits,
            totalCompletions: completed,
            expectedCompletions,
            completionRate: expectedCompletions
              ? Math.round((completed / expectedCompletions) * 100)
              : 0,
          });
        }
      );
    }
  );
});

export default router;