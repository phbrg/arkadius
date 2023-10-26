const User = require('../models/User');
const Profile = require('../models/Profile');
const session = require('express-session');

const bcrypt = require('bcryptjs');

module.exports = class ProfileContoller {
  static async profileControl(req, res) {
    const userId = req.session.userid;

    const checkIfProfileExist = await Profile.findOne({ where: { UserId: userId } });

    const profileOwner = await User.findOne({ where: { id: userId } });

    const earlyBagde = '🎇 early'

    const name = profileOwner.name.toLowerCase();

    if (checkIfProfileExist === null) {
      Profile.create({ icon: '/images/default.jpg', background: '#111111', border: '#46A832', name: name, bio: `Hello i'm new here!`, badges: [earlyBagde], UserId: userId })
        .then(() => {
          req.session.save(() => {
            res.redirect(`/profile/${profileOwner.name}`);
          })
        })
        .catch((err) => console.log(`Update error: ${err}`));
    } else {
      res.redirect(`/profile/${profileOwner.name}`);
    }
  }

  static async profile(req, res) {
    const userId = req.session.userid;

    const profileOwner = req.params.name;

    const checkProfile = await Profile.findOne({ raw: true, where: { name: profileOwner } });

    if (checkProfile === null) {
      res.render('error/404');

      return;
    }

    let isOwner = false;

    if (checkProfile.UserId == userId) {
      isOwner = true;
    }

    const dbDate = checkProfile.createdAt;

    const formatDate = `since ${dbDate.getMonth() + 1}/${dbDate.getDate()}/${dbDate.getFullYear()}`;

    const profile = checkProfile;

    let profilePic = '/images/default.jpg';

    if (checkProfile.icon !== null) {
      profilePic = checkProfile.icon.replace(/public\\/g, '/');
    }

    const links = checkProfile.links;
    const badges = checkProfile.badges;

    let haveLinks = true;

    if(checkProfile.links <= 0 || checkProfile.links[0] == '') {
      haveLinks = false;
    }

    res.render('profile/profile', { profile, isOwner, formatDate, profilePic, links, badges, haveLinks });
  }
}