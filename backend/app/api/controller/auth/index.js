const router = require('express').Router();
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const { sequelize, db } = require('../../../../lib/connection');
const { WrongParametersError, ServiceError } = require('../../../../lib/errors');

const { Op } = sequelize;
const DAY = 24 * 60 * 60 * 1000;

// todo add checks and search by email
passport.use(new LocalStrategy((username, password, done) => {
  let user = null;
  db.User.findOne({ where: { username } }).then((result) => {
    if (!result) {
      return done(null, false, { message: 'Incorrect username.' });
    }

    user = result;
    return result.validPassword(password);
  }).then((valid) => {
    if (!valid) {
      done(null, false, { message: 'Incorrect password.' });
      return;
    }

    done(null, user);
  }).catch((err) => { done(err); });
}));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  db.User.findById(id).then((user) => {
    done(null, user);
  }).catch((err) => {
    done(err);
  });
});

router.post('/signIn', passport.authenticate('local'), (req, res) => {
  res.json({
    code: 200,
    status: 'success',
  });
});
router.post('/signUp', (req, res, next) => {
  if (req.user) {
    return next(new Error('Already signed in'));
  }

  return db.User.findOne({
    where: {
      [Op.or]: [{ username: req.body.username }, { email: req.body.email }],
    },
  }).then((user) => {
    if (user) {
      return next(new Error('User already exist'));
    }

    return db.User.addNew({
      username: req.body.username,
      email: req.body.email,
      phone: req.body.phone,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      password: req.body.password,
    });
  }).then(() => {
    res.status(201).json({
      code: 201,
      status: 'success',
    });
  }).catch((err) => {
    next(err);
  });
});
router.get('/logout', (req, res) => {
  req.logout();
  res.json({
    code: 200,
    status: 'success',
  });
});
router.get('/verification', (req, res, next) => {
  if (!req.query.token || !req.query.token.trim()) {
    next(new WrongParametersError({ message: 'token is empty' }));
  }

  db.Verification.findOne({
    where: { id: req.query.token },
    include: [{
      model: db.User,
      where: { id: sequelize.col('verifications.userId') },
      as: 'user',
    }],
  }).then((verification) => {
    if (!verification) {
      throw new WrongParametersError({ message: 'Wrong token' });
    }

    if (verification.user.isVerified) {
      throw new ServiceError({ message: 'User already verified' });
    }

    if ((new Date(verification.created_at).getTime()) < (Date.now() - DAY)) {
      throw new ServiceError({ message: 'Verification token was expired' });
    }

    return db.User.update({ isVerified: true }, { where: { id: verification.user.id } });
  }).then(() => {
    res.send({
      code: 200,
      status: 'success',
      message: 'User was verified',
    });
  }).catch((err) => {
    next(err);
  });
});

module.exports = router;
