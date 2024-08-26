const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Workout = require('./Workout');
const Exercise = require('./Exercise');

class WorkoutExercise extends Model {}

WorkoutExercise.init({
    workout_id: {
        type: DataTypes.INTEGER,
        references: {
            model: Workout, // Ensure this matches the table name
            key: 'id',
        },
    },
    exercise_id: {
        type: DataTypes.INTEGER,
        references: {
            model: Exercise, // Ensure this matches the table name
            key: 'id',
        },
    },
    sets: DataTypes.INTEGER,
    repetitions: DataTypes.INTEGER,
    weight: DataTypes.FLOAT,
}, { sequelize, modelName: 'workout_exercise' });

// Define associations
WorkoutExercise.belongsTo(Workout, { foreignKey: 'workout_id' });
WorkoutExercise.belongsTo(Exercise, { foreignKey: 'exercise_id' });
Workout.hasMany(WorkoutExercise, { foreignKey: 'workout_id', onDelete: 'CASCADE' });

module.exports = WorkoutExercise;