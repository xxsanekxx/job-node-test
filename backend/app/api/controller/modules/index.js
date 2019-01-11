const router = require('express').Router();
const config = require('config');
const { db } = require('../../../../lib/connection');
const { NotFoundError, ServiceError } = require('../../../../lib/errors');
const authMiddleware = require('../../middleware/auth');

router.get('/', (req, res, next) => {
  const query = {
    where: { enabled: true },
    limit: req.query.limit || 50,
    offset: req.query.offset,
  };
  const user = req.isAuthenticated() && req.user;

  if (user) {
    query.include = [{
      model: db.User,
      through: {
        where: { status: config.get('orderStatuses.paid'), userId: req.user.id },
      },
      required: !!req.query.own,
    }];
  }

  db.Module.findAll(query).then((result) => {
    res.json({
      code: 200,
      status: 'success',
      data: result.map(module => module.get({ plain: true })),
    });
  }).catch((err) => {
    next(err);
  });
});

router.get('/:id', (req, res, next) => {
  const query = {
    where: { id: req.params.id, enabled: true },
  };
  const user = req.isAuthenticated() && req.user;

  if (user) {
    query.include = [{
      model: db.User,
      through: {
        where: { status: config.get('orderStatuses.paid'), userId: req.user.id },
      },
      required: false,
    }];
  }

  db.Module.findOne(query).then((result) => {
    if (!result) {
      throw new NotFoundError({ message: 'Module doesn\'t exist' });
    }
    res.json({
      code: 200,
      status: 'success',
      data: result.get({ plain: true }),
    });
  }).catch((err) => {
    next(err);
  });
});

router.post('/:id/orders', authMiddleware, (req, res, next) => {
  db.ModuleOrder.findOne({ where: { id: req.params.id, userId: req.user.id } }).then((result) => {
    if (result) {
      const errorMsg = `Order for module ${result.id} already ${(result.status === config.get('orderStatuses.paid') && 'paid') || 'exist'}`;
      throw new ServiceError({ message: errorMsg });
    }

    return db.Module.findOne({ where: { id: req.params.id, enabled: true } });
  }).then((module) => {
    if (!module) {
      throw new NotFoundError({ message: 'Module doesn\'t exist' });
    }

    return db.ModuleOrder.create({
      userId: req.user.id,
      moduleId: req.params.id,
      price: module.price,
      status: config.get('orderStatuses.new'),
    });
  }).then((order) => {
    res.status(201).json({
      code: 201,
      status: 'success',
      data: order.get({ plain: true }),
    });
  })
    .catch((err) => {
      next(err);
    });
});

module.exports = router;
