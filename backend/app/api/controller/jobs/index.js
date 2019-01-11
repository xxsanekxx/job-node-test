const router = require('express').Router();
const { db } = require('../../../../lib/connection');

router.get('/', (req, res, next) => {
  const query = {
    where: { userId: req.user.id },
    limit: req.query.limit || 50,
    offset: req.query.offset,
  };

  db.Job.findAll(query).then((result) => {
    res.json({
      code: 200,
      status: 'success',
      data: result.map(job => job.get({ plain: true })),
    });
  }).catch((err) => {
    next(err);
  });
});

module.exports = router;
