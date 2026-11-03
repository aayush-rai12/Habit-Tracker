import express from 'express';
import db from '../config/db.js';
import authenticateToken from '../middleware/auth.js';

const router = express.Router();
router.use(authenticateToken);

router.get('/', (req, res) => {
  db.all(
    'SELECT id, name, color, createdAt FROM labels WHERE userId = ? ORDER BY name COLLATE NOCASE',
    [req.user.id],
    (err, labels) => {
      if (err) return res.status(500).json({ error: { message: 'Database error.' } });
      res.json(labels);
    }
  );
});

router.post('/', (req, res) => {
  const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
  const color = req.body.color || '#3B82F6';
  if (!name) return res.status(400).json({ error: { message: 'Label name is required.' } });
  if (name.length > 60) return res.status(400).json({ error: { message: 'Label name must be 60 characters or fewer.' } });
  if (!/^#[0-9A-Fa-f]{6}$/.test(color)) {
    return res.status(400).json({ error: { message: 'Color must be a 6-digit hex value.' } });
  }

  db.run(
    'INSERT INTO labels (userId, name, color) VALUES (?, ?, ?)',
    [req.user.id, name, color],
    function (err) {
      if (err?.message.includes('UNIQUE')) {
        return res.status(409).json({ error: { message: 'A label with this name already exists.' } });
      }
      if (err) return res.status(500).json({ error: { message: 'Failed to create label.' } });
      res.status(201).json({ id: this.lastID, name, color });
    }
  );
});

router.patch('/:id', (req, res) => {
  const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
  const color = req.body.color;
  if (!name) return res.status(400).json({ error: { message: 'Label name is required.' } });
  if (name.length > 60) return res.status(400).json({ error: { message: 'Label name must be 60 characters or fewer.' } });
  if (color !== undefined && !/^#[0-9A-Fa-f]{6}$/.test(color)) {
    return res.status(400).json({ error: { message: 'Color must be a 6-digit hex value.' } });
  }

  db.run(
    'UPDATE labels SET name = ?, color = COALESCE(?, color) WHERE id = ? AND userId = ?',
    [name, color, req.params.id, req.user.id],
    function (err) {
      if (err?.message.includes('UNIQUE')) {
        return res.status(409).json({ error: { message: 'A label with this name already exists.' } });
      }
      if (err) return res.status(500).json({ error: { message: 'Failed to update label.' } });
      if (!this.changes) return res.status(404).json({ error: { message: 'Label not found.' } });
      res.json({ message: 'Label updated.' });
    }
  );
});

router.delete('/:id', (req, res) => {
  db.run(
    'DELETE FROM labels WHERE id = ? AND userId = ?',
    [req.params.id, req.user.id],
    function (err) {
      if (err) return res.status(500).json({ error: { message: 'Failed to delete label.' } });
      if (!this.changes) return res.status(404).json({ error: { message: 'Label not found.' } });
      res.json({ message: 'Label deleted.' });
    }
  );
});

export default router;
