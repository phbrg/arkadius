const User = require('../models/User');
const Profile = require('../models/Profile');
const { Op } = require('sequelize');

const logSystem = require('../middlewares/log');
const { use } = require('../routes/adminRoute');

module.exports = class AdminContoller {
  static async dashboard(req, res) {
    let search = '';

    if (req.query.search) {
      search = req.query.search;
    }

    let order = 'DESC';

    const userData = await User.findAll({
      where: {
        name: { [Op.like]: `%${search}%` }
      },
      order: [['createdAt', order]]
    });

    const user = userData.map((result) => result.get({ plain: true }));

    res.render('admin/adminDashboard', { user, search });
  }

  static async editUser(req, res) {
    const userParam = req.params.id;

    const userDb = await User.findOne({ where: { id: userParam }, raw: true });
    const profileDb = await Profile.findOne({ where: { UserId: userParam }, raw: true });

    if (!userDb) {
      res.render('error/404');

      return;
    }

    res.render('admin/editUser', { userDb, profileDb });
  }

  static async editUserPost(req, res) {
    const adminId = req.session.userid;
    let { profileId, userId, name, email, roles, icon, background, border, bio, badges, links } = req.body;

    if (name.length > 255 || email.length > 255 || roles.length > 255 || icon.length > 255 || background.length > 255 || bio.length > 255 || badges.length > 255 || links.length > 255) {
      req.flash('message', 'Credentials exceed limit of characters ( 255 )');
      res.render('admin/editUser');

      return;
    }

    const nameValidator = await Profile.findOne({ where: { name: name.toLowerCase() } });

    if (nameValidator && nameValidator.id !== parseFloat(profileId)) {
      req.flash('message', 'Name alredy registered');
      res.redirect(`/admin`);

      return;
    }

    const rolesSplit = roles.split(',');
    const badgesSplit = badges.split(',');
    let linksSplit;

    try {
      linksSplit = links.split(',');
    } catch (e) {
      linksSplit = links;
    }

    const userUpdate = {
      name: name.toLowerCase(),
      email,
      roles: rolesSplit
    }

    const profileUpdate = {
      name: name.toLowerCase(),
      icon,
      background,
      border,
      bio,
      badges: badgesSplit,
      links: linksSplit
    }

    logSystem(process.env.ADMIN_WEBHOOK, `**Admin edit user**\nAdmin id: **${adminId}**\n- User edited: **${name}**\nOn: **${new Date()}**`);

    await User.update(userUpdate, { where: { id: userId } })
      .then(() => {
        Profile.update(profileUpdate, { where: { id: profileId } })
          .then(() => {
            req.session.save(() => {
              res.redirect('/admin');
            });
          })
          .catch((err) => {
            console.log(`Profile Update error: ${err}`);
            res.redirect('/admin');
          });
      })
      .catch((err) => {
        logSystem(process.env.ADMIN_WEBHOOK, `**Edit user error**\n${err}\nOn: **${new Date()}**`);
        res.redirect('/admin');
      });
  }

  static async banUser(req, res) {
    const adminId = req.session.userid;
    const userId = req.params.id;

    if (adminId == userId) {
      req.flash('message', 'You cannot delete your own account!');
      res.redirect('/admin');

      return;
    }

    const bannedUser = await User.findOne({ where: { id: userId } })

    logSystem(process.env.ADMIN_WEBHOOK, `**Admin ban user**\nAdmin id: **${adminId}**\n- User banned: **${bannedUser.name}**\nOn: **${new Date()}**`);

    try {
      await Profile.destroy({ where: { UserId: userId } });
      await User.destroy({ where: { id: userId } });

      res.redirect('/admin');
    } catch (err) {
      logSystem(process.env.ADMIN_WEBHOOK, `**Delet user error**\n${err}\nOn: **${new Date()}**`);
    }
  }
}