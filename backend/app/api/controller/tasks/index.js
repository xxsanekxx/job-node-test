const router = require('express').Router();
const { db } = require('../../../../lib/connection');

router.get('/', (req, res, next) => {
  const query = {
    include: [{
      model: db.Project,
      where: { userId: req.user.id },
    }],
    limit: req.query.limit || 50,
    offset: req.query.offset,
  };
  db.Task.findAll(query).then((tasks) => {
    res.json({
      code: 200,
      status: 'success',
      data: tasks.map(task => task.get({ plain: true })),
    });
  }).catch((err) => {
    next(err);
  });
});

module.exports = router;
