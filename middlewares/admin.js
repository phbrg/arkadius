const User = require('../models/User');

module.exports.checkAdmin = async (req, res, next) => {
  const userId = req.session.userid;

  const admin = await User.findOne({ where: { id: userId } });

  if (!admin.roles.includes('admin')) {
    res.render('error/404');

    return;
  }

  next();
}