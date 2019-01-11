const config = require('config');
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const passport = require('passport');
const csrf = require('csurf');

// controllers
const authRouter = require('./controller/auth');
const projectsRouter = require('./controller/projects');
const jobsRouter = require('./controller/jobs');
const modulesRouter = require('./controller/modules');
const tasksRouter = require('./controller/tasks');
const usersRouter = require('./controller/users');

const errorMiddleware = require('./middleware/errors');
const authMiddleware = require('./middleware/auth');

const csrfProtection = csrf({ cookie: false });
const app = express();

// todo add nodejs security best practice (limit body size, sanitization, validation)
// todo change use bodyParser only when we need it (per route)
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static('public'));

app.set('trust proxy', 1);
app.use(session({
  secret: config.get('api.sessionSecret'),
  resave: false,
  saveUninitialized: true,
  cookie: { secure: true },
}));
app.use(passport.initialize());
app.use(passport.session());

app.get('/', csrfProtection, (req, res) => {
  res.send(`{ csrfToken: ${req.csrfToken()} }`);
});
app.use(csrfProtection, authRouter);
app.get('/status', (req, res) => { res.send('OK'); });

app.use('/v1/projects', authMiddleware, projectsRouter);
app.use('/v1/jobs', authMiddleware, jobsRouter);
app.use('/v1/modules', modulesRouter);
app.use('/v1/tasks', authMiddleware, tasksRouter);
app.use('/v1/users', authMiddleware, usersRouter);

app.use(errorMiddleware);

app.listen(config.get('api.port'), config.get('api.host'), () => {
  console.log(`node-api started env=${process.env.NODE_ENV}`);
});
