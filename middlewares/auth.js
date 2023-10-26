module.exports.checkAuth = (req, res, next) => {
  const userId = req.session.userid;

  if (!userId) {
    res.redirect('/auth/login');

    return;
  }

  next();
}