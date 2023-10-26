const { DataTypes } = require('sequelize');
const db = require('../db/conn');

const User = require('./User');

const Profile = db.define('Profile', {
  icon: {
    type: DataTypes.STRING,
    allowNull: true
  },
  background: {
    type: DataTypes.STRING,
    allowNull: true
  },
  border: {
    type: DataTypes.STRING,
    allowNull: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  bio: {
    type: DataTypes.STRING,
    allowNull: true
  },
  badges: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [], // can be null
    allowNull: true
  },
  links: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [], // can be null
    allowNull: true
  }
});

Profile.belongsTo(User);
User.hasOne(Profile);

module.exports = Profile;