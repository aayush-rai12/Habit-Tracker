import express from 'express';
import db from '../config/db.js';
import authenticateToken from '../middleware/auth.js';

const router = express.Router();
// Middleware to authenticate JWT token for all habit routes
router.use(authenticateToken);

const frequencies = new Set(['DAILY', 'WEEKLY', 'MONTHLY']);
const statuses = new Set(['ACTIVE', 'ARCHIVED', 'TRASHED']);

const isValidDate = (value) => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

const parseLabelIds = (labels) => {
  if (labels === undefined) return null;
  if (!Array.isArray(labels) || labels.some((id) => !Number.isInteger(Number(id)) || Number(id) < 1)) {
    return false;
  }
  return [...new Set(labels.map(Number))];
};

const validateLabelOwnership = (userId, labelIds, callback) => {
  if (!labelIds?.length) return callback(null, true);
  const placeholders = labelIds.map(() => '?').join(', ');
  db.get(
    `SELECT COUNT(*) AS count FROM labels WHERE userId = ? AND id IN (${placeholders})`,
    [userId, ...labelIds],
    (err, row) => callback(err, !err && row.count === labelIds.length)
  );
};

const replaceHabitLabels = (habitId, labelIds, callback) => {
  db.run('DELETE FROM habit_labels WHERE habitId = ?', [habitId], (err) => {
    if (err) return callback(err);
    const insertNext = (index) => {
      if (index >= labelIds.length) return callback(null);
      db.run(
        'INSERT INTO habit_labels (habitId, labelId) VALUES (?, ?)',
        [habitId, labelIds[index]],
        (insertErr) => insertErr ? callback(insertErr) : insertNext(index + 1)
      );
    };
    insertNext(0);
  });
};

const validateHabitFields = ({ name, startDate, endDate, goal, frequency, color }) => {
  if (typeof name !== 'string' || !name.trim()) return 'Habit name is required.';
  if (!isValidDate(startDate)) return 'Start date must be a valid YYYY-MM-DD date.';
  if (endDate && (!isValidDate(endDate) || endDate < startDate)) {
    return 'End date must be a valid date on or after the start date.';
  }
  if (!Number.isInteger(Number(goal)) || Number(goal) < 1) return 'Goal must be a positive whole number.';
  if (!frequencies.has(frequency)) return 'Frequency must be DAILY, WEEKLY, or MONTHLY.';
  if (!/^#[0-9A-Fa-f]{6}$/.test(color)) return 'Color must be a 6-digit hex value.';
  return null;
};

// CREATE HABIT (with Labels)
router.post('/', (req, res) => {
  const { name, description, startDate, endDate, goal = 1, frequency = 'DAILY', color = '#E0E7FF' } = req.body;
  const userId = req.user.id;
  const labelIds = parseLabelIds(req.body.labels);

  const validationError = validateHabitFields({ name, startDate, endDate, goal, frequency, color });
  if (validationError) return res.status(400).json({ error: { message: validationError } });
  if (labelIds === false) return res.status(400).json({ error: { message: 'Labels must be an array of label IDs.' } });

  validateLabelOwnership(userId, labelIds, (labelErr, labelsOwned) => {
    if (labelErr) return res.status(500).json({ error: { message: 'Could not validate labels.' } });
    if (!labelsOwned) return res.status(400).json({ error: { message: 'One or more labels are invalid.' } });

    db.run(
      `INSERT INTO habits (userId, name, description, startDate, endDate, goal, frequency, color)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, name.trim(), description || null, startDate, endDate || null, Number(goal), frequency, color],
      function (err) {
        if (err) return res.status(500).json({ error: { message: 'Failed to create habit.' } });
        const habitId = this.lastID;
        replaceHabitLabels(habitId, labelIds || [], (labelsErr) => {
          if (labelsErr) {
            return db.run('DELETE FROM habits WHERE id = ? AND userId = ?', [habitId, userId], () => {
              res.status(500).json({ error: { message: 'Failed to save habit labels.' } });
            });
          }
          res.status(201).json({ message: 'Habit created', habitId });
        });
      }
    );
  });
});

// GET ALL HABITS (with Labels)
router.get('/', (req, res) => {
  const userId = req.user.id;
  const { status = 'ACTIVE' } = req.query;
  if (!statuses.has(status)) return res.status(400).json({ error: { message: 'Invalid habit status.' } });

  const sql = `
    SELECT h.*, GROUP_CONCAT(l.name) as labelNames, GROUP_CONCAT(l.id) as labelIds
    FROM habits h
    LEFT JOIN habit_labels hl ON h.id = hl.habitId
    LEFT JOIN labels l ON hl.labelId = l.id AND l.userId = h.userId
    WHERE h.userId = ? AND h.status = ?
    GROUP BY h.id
    ORDER BY h.createdAt DESC
  `;

  db.all(sql, [userId, status], (err, habits) => {
    if (err) return res.status(500).json({ error: { message: 'Database error.' } });

    // GROUP_CONCAT string deta hai, use array me convert karein
    const formattedHabits = habits.map((habit) => ({
      ...habit,
      labels: habit.labelNames ? habit.labelNames.split(',') : [],
      labelIds: habit.labelIds ? habit.labelIds.split(',').map(Number) : [],
      labelNames: undefined,
    }));

    res.json(formattedHabits);
  });
});

// GET SINGLE HABIT
router.get('/:id', (req, res) => {
  const userId = req.user.id;
  db.get('SELECT * FROM habits WHERE id = ? AND userId = ?', [req.params.id, userId], (err, habit) => {
    if (err) return res.status(500).json({ error: { message: 'Database error.' } });
    if (!habit) return res.status(404).json({ error: { message: 'Habit not found.' } });
    res.json(habit);
  });
});

// UPDATE HABIT
router.patch('/:id', (req, res) => {
  const userId = req.user.id;
  const { name, description, startDate, endDate, goal, frequency, color } = req.body;

  db.get('SELECT * FROM habits WHERE id = ? AND userId = ?', [req.params.id, userId], (err, habit) => {
    if (err || !habit) return res.status(404).json({ error: { message: 'Habit not found.' } });

    const updatedName = name === undefined ? habit.name : name;
    const updatedDesc = description !== undefined ? description : habit.description;
    const updatedStartDate = startDate === undefined ? habit.startDate : startDate;
    const updatedEndDate = endDate !== undefined ? endDate : habit.endDate;
    const updatedGoal = goal !== undefined ? goal : habit.goal;
    const updatedFreq = frequency === undefined ? habit.frequency : frequency;
    const updatedColor = color === undefined ? habit.color : color;
    const labelIds = parseLabelIds(req.body.labels);
    const validationError = validateHabitFields({
      name: updatedName,
      startDate: updatedStartDate,
      endDate: updatedEndDate,
      goal: updatedGoal,
      frequency: updatedFreq,
      color: updatedColor,
    });
    if (validationError) return res.status(400).json({ error: { message: validationError } });
    if (labelIds === false) return res.status(400).json({ error: { message: 'Labels must be an array of label IDs.' } });

    validateLabelOwnership(userId, labelIds, (labelErr, labelsOwned) => {
      if (labelErr) return res.status(500).json({ error: { message: 'Could not validate labels.' } });
      if (!labelsOwned) return res.status(400).json({ error: { message: 'One or more labels are invalid.' } });

      db.run(
        `UPDATE habits SET name = ?, description = ?, startDate = ?, endDate = ?, goal = ?,
         frequency = ?, color = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ? AND userId = ?`,
        [updatedName.trim(), updatedDesc || null, updatedStartDate, updatedEndDate || null, Number(updatedGoal), updatedFreq, updatedColor, req.params.id, userId],
        function (updateErr) {
          if (updateErr) return res.status(500).json({ error: { message: 'Update failed.' } });
          if (labelIds === null) return res.json({ message: 'Habit updated' });
          replaceHabitLabels(req.params.id, labelIds, (labelsErr) => {
            if (labelsErr) return res.status(500).json({ error: { message: 'Habit updated but labels could not be saved.' } });
            res.json({ message: 'Habit updated' });
          });
        }
      );
    });
  });
});

// ARCHIVE
router.post('/:id/archive', (req, res) => {
  const userId = req.user.id;
  db.run('UPDATE habits SET status = "ARCHIVED" WHERE id = ? AND userId = ?', [req.params.id, userId], function(err) {
    if (err) return res.status(500).json({ error: { message: 'Failed to archive.' } });
    if (this.changes === 0) return res.status(404).json({ error: { message: 'Habit not found.' } });
    res.json({ message: 'Habit archived' });
  });
});

// UNARCHIVE / RESTORE
router.post('/:id/unarchive', (req, res) => {
  const userId = req.user.id;
  db.run('UPDATE habits SET status = "ACTIVE" WHERE id = ? AND userId = ?', [req.params.id, userId], function(err) {
    if (err) return res.status(500).json({ error: { message: 'Failed.' } });
    if (this.changes === 0) return res.status(404).json({ error: { message: 'Habit not found.' } });
    res.json({ message: 'Habit restored' });
  });
});

// DELETE (move to trash)
router.delete('/:id', (req, res) => {
  const userId = req.user.id;
  db.run('UPDATE habits SET status = "TRASHED" WHERE id = ? AND userId = ?', [req.params.id, userId], function(err) {
    if (err) return res.status(500).json({ error: { message: 'Failed.' } });
    if (this.changes === 0) return res.status(404).json({ error: { message: 'Habit not found.' } });
    res.json({ message: 'Habit moved to trash' });
  });
});

// PERMANENT DELETE
router.delete('/:id/permanent', (req, res) => {
  const userId = req.user.id;
  db.run('DELETE FROM habits WHERE id = ? AND userId = ? AND status = "TRASHED"', [req.params.id, userId], function(err) {
    if (err) return res.status(500).json({ error: { message: 'Failed.' } });
    if (this.changes === 0) return res.status(404).json({ error: { message: 'Habit not found.' } });
    res.json({ message: 'Habit permanently deleted' });
  });
});

export default router;