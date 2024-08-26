const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class Exercise extends Model {}

Exercise.init({
    name: DataTypes.STRING,
    description: DataTypes.STRING,
    category: DataTypes.STRING,
    muscle_group: DataTypes.STRING,
}, { sequelize, modelName: 'exercise' });

module.exports = Exercise;