const User = require('../models/User');
const Profile = require('../models/Profile');
const session = require('express-session');
require('dotenv').config();

const logSystem = require('../middlewares/log');

const bcrypt = require('bcryptjs');

module.exports = class AuthContoller {
  static loginPage(req, res) {
    res.render('auth/login');
  }

  static registerPage(req, res) {
    res.render('auth/register');
  }

  static async createUser(req, res) {
    const { name, email, password, confirmpassword } = req.body;

    const checkIfEmailExist = await User.findOne({ where: { email: email } });
    const checkIfUserExist = await User.findOne({ where: { name: name.toLowerCase() } });

    if (name.length > 255 || email.length > 255 || password.length > 255 || confirmpassword.length > 255) {
      req.flash('message', 'Credentials too big, max characters: 255');
      res.render('auth/register');

      return;
    }

    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;

    if (!emailRegex.test(email)) {
      req.flash('message', 'Invalid email');
      res.render('auth/register');

      return;
    }

    if (password !== confirmpassword) {
      req.flash('message', 'Passwords does not match');
      res.render('auth/register');

      return;
    } else if (password.length < 6) {
      req.flash('message', 'Your password is too short');
      res.render('auth/register');

      return;
    } else if (name.length < 1) {
      req.flash('message', 'Your name is too short');
      res.render('auth/register');

      return;
    } else if (checkIfUserExist) {
      req.flash('message', 'This name is alredy registered');
      res.render('auth/register');

      return;
    } else if (checkIfEmailExist) {
      req.flash('message', 'This e-mail is alredy registered');
      res.render('auth/register');

      return;
    }

    const avaliableCharacters = /^[a-zA-Z0-9!$\-_]+$/;

    if (!avaliableCharacters.test(name)) {
      req.flash('message', 'name have invalid characters');
      res.render('auth/register');

      return;
    }


    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);

    const user = {
      name: name.toLowerCase(),
      email,
      password: hashedPassword
    }

    User.create(user)
      .then((user) => {
        req.session.userid = user.id;

        logSystem(process.env.AUTH_WEBHOOK, `**New user created**\n- Username: **${name}**\n- Email: **${email}**\nOn: **${user.createdAt}**`);

        req.session.save(() => {
          res.redirect('/profile/');
        })
      })
      .catch((err) => logSystem(process.env.AUTH_WEBHOOK, `**Create user error**\n${err}\nOn: **${new Date()}**`));
  }

  static async login(req, res) {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email: email } });

    if (!user) {
      req.flash('message', 'Invalid credentials.')
      res.render('auth/login');

      return;
    }

    const passwordMatch = bcrypt.compareSync(password, user.password);

    if (!passwordMatch) {
      req.flash('message', 'Invalid credentials.')
      res.render('auth/login');

      return;
    }

    req.session.userid = user.id;

    logSystem(process.env.AUTH_WEBHOOK, `**New login**\n- Email: **${email}**\nOn: **${new Date()}**`);

    req.session.save(() => {
      res.redirect(`/profile/${user.name}`);
    });
  }

  static logout(req, res) {
    req.session.destroy();
    res.redirect('/auth/login');
  }

  static async editProfile(req, res) {
    const userId = req.session.userid;

    const profileDb = await Profile.findOne({ where: { UserId: userId }, raw: true });

    if (!profileDb) {
      res.render('error/404');

      return;
    }

    res.render('profile/editProfile', { profileDb });
  }

  static async editProfilePost(req, res) {
    const userId = req.session.userid;

    const profileDb = await Profile.findOne({ where: { id: userId }, raw: true });

    if (!profileDb) {
      res.render('error/404');

      return;
    }

    let { name, bio, background, border, links } = req.body;

    if (name.length > 255 || bio.length > 255 || background.length > 255 || links.length > 255) {
      req.flash('message', 'Credentials exceed limit of characters ( 255 )');
      res.render('profile/editProfile');

      return;
    }

    const nameValidator = await User.findOne({ where: { name: name.toLowerCase() } });

    if (nameValidator && nameValidator.id !== userId) {
      req.flash('message', 'Name alredy registered');
      res.redirect(`/profile/edit_profile`);

      return;
    }

    if (links == '') {
      links = [];
    }

    let icon = profileDb.icon;

    if (req.file) {
      icon = req.file.path;
    }

    let linksSplit;

    try {
      linksSplit = links.split(',');
    } catch (e) {
      linksSplit = links;
    }

    const userUpdate = {
      name: name.toLowerCase(),
    }

    const profileUpdate = {
      icon,
      name: name.toLowerCase(),
      bio,
      background,
      border,
      bio,
      links: linksSplit,
    }

    logSystem(process.env.AUTH_WEBHOOK, `**Profile update**\nUpdated by: **${userId}**\n- Username: **${name}**\n- Bio: **${bio}**\n- Links: **${linksSplit}**\nOn: **${new Date()}**`);

    await User.update(userUpdate, { where: { id: userId } })
      .then(() => {
        Profile.update(profileUpdate, { where: { UserId: userId } })
          .then(() => {
            req.session.save(() => {
              res.redirect(`/profile/`);
            });
          })
          .catch((err) => {
            console.log(`Profile Update error: ${err}`);
            res.redirect(`/`);
          });
      })
      .catch((err) => {
        logSystem(process.env.AUTH_WEBHOOK, `**Profile update error**\n${err}\nOn: **${new Date()}**`);
        res.redirect(`/`);
      });
  }

  static async editUser(req, res) {
    const userId = req.session.userid;

    const userDb = await User.findOne({ where: { id: userId }, raw: true });

    if (!userDb) {
      res.render('error/404');

      return;
    }

    res.render('profile/editUser', { userDb });
  }

  static async editUserPost(req, res) {
    const userId = req.session.userid;

    const userDb = await User.findOne({ where: { id: userId }, raw: true });

    if (!userDb.id) {
      res.render('error/404');

      return;
    }

    let { email, password, confirmPassword } = req.body;

    if (email.length > 255 || password.length > 255 || confirmPassword.length > 255) {
      req.flash('message', 'Credentials exceed limit of characters ( 255 )');
      res.render('profile/editUser');

      return;
    }

    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;

    if (!emailRegex.test(email)) {
      req.flash('message', 'Invalid email');
      res.render('profile/editUser');

      return;
    }

    if (password !== confirmPassword) {
      req.flash('message', 'Password does not match');
      res.render('profile/editUser');

      return;
    }

    let passwordChanged = true;

    if (password == null || password == undefined || confirmPassword == null || confirmPassword == undefined || password == '') {
      password = userDb.password;

      passwordChanged = false;
    }

    let userUpdate = {
      email,
      password
    }

    if (passwordChanged == true) {
      const salt = bcrypt.genSaltSync(10);
      const hashedPassword = bcrypt.hashSync(password, salt);

      userUpdate = {
        email,
        password: hashedPassword
      }
    }

    logSystem(process.env.AUTH_WEBHOOK, `**Email and/or password update**\nUpdated by: **${userId}**\n- Email: **${email}**\nOn: **${new Date()}**`);

    await User.update(userUpdate, { where: { id: userId } })
      .then(() => {
        req.session.save(() => {
          res.redirect(`/profile/`);
        });
      })
      .catch((err) => {
        logSystem(process.env.AUTH_WEBHOOK, `**User update error**\n${err}\nOn: **${new Date()}**`);
        res.redirect(`/profile/`);
      });
  }

  static async deleteUser(req, res) {
    const userId = req.session.userid;

    const deletedUser = await User.findOne({ where: { id: userId } });

    logSystem(process.env.AUTH_WEBHOOK, `**User deleted**\nDeleted by: **${userId}**\n- Id: **${deletedUser.UserId}**\n- Username: **${deletedUser.name}**\n- Email: **${deletedUser.email}**\nOn: **${new Date()}**`);

    try {
      await Profile.destroy({ where: { UserId: userId } });
      await User.destroy({ where: { id: userId } });

      req.session.destroy();

      res.redirect('/');
    } catch (err) {
      console.log(`Delete user error: ${err}`);
    }
  }

  static async forgetPassword(req, res) {
    res.render('auth/forgetPassword');
  }

  static async forgetPasswordPost(req, res) {
    const { email, password, confirmPassword } = req.body;

    const owner = await User.findOne({ where: { email: email } });

    if(!owner) {
      req.flash('message', 'No account found with this email');
      res.redirect('/auth/forget_password');

      return;
    }

    if (password.length > 255 || confirmPassword.length > 255) {
      req.flash('message', 'Credentials exceed limit of characters ( 255 )');
      res.redirect('/auth/forget_password');

      return;
    }

    if (password !== confirmPassword) {
      req.flash('message', 'Password does not match');
      res.redirect('/auth/forget_password');

      return;
    }

    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(password, salt);

    logSystem(process.env.AUTH_WEBHOOK, `**Password reseted**\n- Account changed: **${owner.name}**\nOn: **${new Date()}**`);

    await User.update({ password: hashedPassword }, { where: { id: owner.id } })
      .then(() => {
        req.session.save(() => {
          res.redirect(`/`);
        });
      })
      .catch((err) => {
        logSystem(process.env.AUTH_WEBHOOK, `**Forget password error**\n${err}\nOn: **${new Date()}**`);
        res.redirect(`/`);
      });
  }
}