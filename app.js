// db stuff
const port = 3000;
const conn = require('./db/conn');

// requires
const pg = require('pg');
const express = require('express');
const exphbs = require('express-handlebars');
const session = require('express-session');
const FileStore = require('session-file-store')(session);
const flash = require('express-flash');
require('dotenv').config();

const app = express();

// template engine
app.engine('handlebars', exphbs.engine());
app.set('view engine', 'handlebars');

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// session
app.use(
  session({
    name: 'session',
    secret: 'secret',
    resave: false,
    saveUninitialized: false,
    store: new FileStore({
      logFn: () => { },
      path: require('path').join(require('os').tmpdir(), 'sessions'),
    }),
    cookie: {
      secure: false,
      maxAge: 360000,
      httpOnly: true,
    },
  })
);

// flash
app.use(flash());

// templates
app.use((req, res, next) => {
  if (req.session.userid) {
    res.locals.session = req.session;
  }
  next();
});

// db tables
const User = require('./models/User');
const Profile = require('./models/Profile');

// routes
const homeRoute = require('./routes/homeRoute');
const authRoute = require('./routes/authRoute');
const profileRoute = require('./routes/profileRoute');
const adminRoute = require('./routes/adminRoute');
const HomeController = require('./controllers/HomeController');
const AuthController = require('./controllers/AuthController');
const ProfileController = require('./controllers/ProfileController');
const AdminController = require('./controllers/AdminController');

app.use('/', homeRoute);
app.use('/profile', profileRoute);
app.use('/auth', authRoute);
app.use('/admin', adminRoute);

// 404
app.use((req, res, next) => {
  res.status(404).render('error/404');
});

// server
conn
  //.sync({force:true})
  .sync()
  .then(() =>
    app.listen(port, () => console.log(`> Server on | http://localhost:${port}`))
  )
  .catch((err) => console.log(`Sync Error: ${err}`));