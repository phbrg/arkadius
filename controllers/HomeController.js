const User = require('../models/User');

module.exports = class HomeContoller {
  static homePage(req, res) {
    const userId = req.session.userid;

    let isLog = false;
    if(userId) {
      isLog = true;
    }

    res.render('home/home', { isLog });
  }

  static register(req, res) {
    const name = req.body.name;

    res.render('auth/register', { name })
  }
}