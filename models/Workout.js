const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class Workout extends Model {}

Workout.init({
    user_id: {
        type: DataTypes.INTEGER,
        references: {
            model: 'users', // Ensure this matches the table name
            key: 'id',
        },
    },
    date: DataTypes.DATE,
    comments: DataTypes.STRING,
    scheduled_time: { // New field for scheduled time
        type: DataTypes.DATE,
        allowNull: true, // This can be optional
    },
}, { sequelize, modelName: 'workout' });

module.exports = Workout;