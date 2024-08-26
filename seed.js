const sequelize = require('./config/database');
const Exercise = require('./models/Exercise');

const exercises = [
    { name: 'Push Up', description: 'A basic upper body exercise', category: 'strength', muscle_group: 'chest' },
    { name: 'Squat', description: 'A lower body exercise', category: 'strength', muscle_group: 'legs' },
    { name: 'Lunges', description: 'A lower body exercise', category: 'strength', muscle_group: 'legs' },
    { name: 'Plank', description: 'Core stability exercise', category: 'strength', muscle_group: 'core' },
    { name: 'Burpees', description: 'Full body exercise', category: 'cardio', muscle_group: 'full body' },
    { name: 'Jumping Jacks', description: 'Cardio exercise', category: 'cardio', muscle_group: 'full body' },
    { name: 'Bicep Curl', description: 'Upper body exercise', category: 'strength', muscle_group: 'arms' },
    { name: 'Tricep Dips', description: 'Upper body exercise', category: 'strength', muscle_group: 'arms' },
    { name: 'Deadlift', description: 'Lower body exercise', category: 'strength', muscle_group: 'legs' },
    { name: 'Yoga', description: 'Flexibility exercise', category: 'flexibility', muscle_group: 'full body' },
];

const seedExercises = async () => {
    try {
        await sequelize.sync(); // Ensure the database is synced
        await Exercise.bulkCreate(exercises); // Bulk insert exercises
        console.log('Exercises seeded successfully!');
    } catch (error) {
        console.error('Error seeding exercises:', error);
    } finally {
        await sequelize.close(); // Close the database connection
    }
};

seedExercises();