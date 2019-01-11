const router = require('express').Router();
const config = require('config');
const { db, sequelize } = require('../../../../lib/connection');
const { NotFoundError, ServiceError } = require('../../../../lib/errors');
const intervals = require('../../../../lib/intervals');

const { Op } = sequelize;

router.get('/', (req, res, next) => {
  db.Project.findAll({
    where: { userId: req.user.id },
  }).then((result) => {
    res.json({
      code: 200,
      status: 'success',
      data: result.get({ plain: true }),
    });
  }).catch((err) => {
    next(err);
  });
});

router.get('/:id', (req, res, next) => {
  db.Project.findOne({
    where: { id: req.params.id, userId: req.user.id },
  }).then((result) => {
    if (!result) {
      throw new NotFoundError({ message: 'Project doesn\'t exist' });
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

router.post('/', (req, res, next) => {
  // todo change to raw query "'now'::timestamp - '1 month'::interval" and move to method
  db.Order.findOne({
    where: {
      userId: req.user.id,
      status: config.get('orderStatuses.paid'),
      paidAt: { [Op.gte]: intervals.getMonthAgo() },
    },
    order: [['updatedAt', 'DESC']],
  }).then((order) => {
    const noFreeProjectError = new ServiceError({ message: 'Your limit of new project is 0' });
    if (!order) {
      throw noFreeProjectError;
    }

    return db.Project.count({ where: { userId: req.user.id } }).then((count) => {
      if (count >= order.maxProjects) {
        throw noFreeProjectError;
      }

      // eslint-disable-next-line
      const schedulerTime = (req.body.schedulerTime instanceof Date && req.body.schedulerTime) || new Date(req.body.schedulerTime);
      const minStartTime = intervals.getNextSchedulerTime(new Date(), 'per5Min');
      const startTime = schedulerTime < minStartTime ? minStartTime : schedulerTime;

      return db.Project.create({
        host: req.body.host,
        intervalTime: req.body.intervalTime,
        enabled: true,
        callbackUrl: req.body.callbackUrl,
        userId: req.user.id,
        responseTypeId: req.body.responseTypeId,
        moduleId: req.body.moduleId,
        schedulerTime: startTime,
      });
    });
  }).then((project) => {
    res.status(201).json({
      code: 201,
      status: 'success',
      data: project.get({ plain: true }),
    });
  }).catch((err) => {
    next(err);
  });
});

router.put('/:id', (req, res, next) => {
  db.Project.update({
    intervalTime: req.body.intervalTime,
    responseTypeId: req.body.responseTypeId,
    enabled: req.body.enabled,
    callbackUrl: req.body.callbackUrl,
  }, {
    where: { id: req.params.id, userId: req.user.id },
  }).then((affectedRows) => {
    if (affectedRows < 1) {
      throw new NotFoundError({ message: 'Project not found' });
    }

    res.json({
      code: 200,
      status: 'success',
    });
  }).catch((err) => {
    next(err);
  });
});

router.post('/:id/tasks', (req, res, next) => {
  db.Project.findOne({
    where: { id: req.params.id, userId: req.user.id },
  }).then((project) => {
    if (!project) {
      throw new NotFoundError({ message: 'Project not found' });
    }

    return project.getTask();
  }).then((task) => {
    if (task) {
      throw new ServiceError({ message: 'Task already exist' });
    }

    return db.Task.create({
      actions: req.body.actions,
      enabled: false,
      projectId: req.params.id,
    });
  }).then((task) => {
    res.json({
      code: 200,
      status: 'success',
      data: task.get({ plain: true }),
    });
  })
    .catch((err) => {
      next(err);
    });
});

router.put('/:id/tasks/:taskId', (req, res, next) => {
  db.Project.findOne({
    where: { id: req.params.id, userId: req.user.id },
  }).then((project) => {
    if (!project) {
      throw new NotFoundError({ message: 'Project not found' });
    }

    if (!project.Task) {
      throw new NotFoundError({ message: 'Task not found' });
    }

    return db.Task.update({
      actions: req.body.actions,
      enabled: req.body.enabled,
    }, { where: { projectId: req.params.id, id: req.params.taskId } });
  }).then((affectedRows) => {
    if (affectedRows < 1) {
      throw new NotFoundError({ message: 'Task not found' });
    }

    res.json({
      code: 200,
      status: 'success',
    });
  })
    .catch((err) => {
      next(err);
    });
});

module.exports = router;
