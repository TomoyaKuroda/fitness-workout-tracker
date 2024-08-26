const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class User extends Model {}

User.init({
    username: { type: DataTypes.STRING, unique: true },
    password_hash: DataTypes.STRING,
    email: { type: DataTypes.STRING, unique: true },
}, { sequelize, modelName: 'user' });

module.exports = User;