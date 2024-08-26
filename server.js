const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const { body, validationResult } = require('express-validator');
const sequelize = require('./config/database');
const User = require('./models/User');
const Exercise = require('./models/Exercise');
const Workout = require('./models/Workout');
const WorkoutExercise = require('./models/WorkoutExercise');

const app = express();
app.use(bodyParser.json());
app.use(cors());
const JWT_SECRET = 'your_jwt_secret'; // Change this to a secure secret

// Error handling middleware
const errorHandler = (err, req, res, next) => {
    console.error(err);
    res.status(500).json({ message: 'Internal Server Error' });
};

// User Signup
app.post('/api/signup', [
	body('username').isString().notEmpty(),
	body('password').isString().isLength({ min: 6 }),
	body('email').isEmail(),
], async (req, res) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
			return res.status(400).json({ 
					message: 'Validation errors occurred', // Add a message for validation errors
					errors: errors.array() 
			});
	}

	try {
			const { username, password, email } = req.body;
			const password_hash = await bcrypt.hash(password, 10);
			const user = await User.create({ username, password_hash, email });
			res.status(201).json({ message: 'User created successfully', user }); // Include a success message
	} catch (error) {
			console.error('Error creating user:', error);
			res.status(500).json({ message: 'Internal Server Error' }); // Ensure a message is sent on error
	}
});

// User Login
app.post('/api/login', [
    body('username').isString().notEmpty(),
    body('password').isString().notEmpty(),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { username, password } = req.body;
    const user = await User.findOne({ where: { username } });
    if (user && await bcrypt.compare(password, user.password_hash)) {
        const token = jwt.sign({ id: user.id }, JWT_SECRET);
        res.json({ token });
    } else {
        res.status(401).json({ message: 'Invalid credentials' });
    }
});

// Middleware to authenticate JWT
const authenticateJWT = (req, res, next) => {
    const token = req.headers['authorization'];
    if (token) {
        jwt.verify(token, JWT_SECRET, (err, user) => {
            if (err) return res.sendStatus(403);
            req.user = user;
            next();
        });
    } else {
        res.sendStatus(401);
    }
};

// Create Exercise
app.post('/api/exercises', authenticateJWT, [
    body('name').isString().notEmpty(),
    body('description').isString().optional(),
    body('category').isString().optional(),
    body('muscle_group').isString().optional(),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, category, muscle_group } = req.body;
    const exercise = await Exercise.create({ name, description, category, muscle_group });
    res.status(201).json(exercise);
});

// List Exercises
app.get('/api/exercises', async (req, res) => {
    const exercises = await Exercise.findAll();
    res.json(exercises);
});

// Create Workout
app.post('/api/workouts', authenticateJWT, [
	body('date').isISO8601(),
	body('comments').isString().optional(),
	body('scheduled_time').isISO8601().optional(), // New field for scheduled time
	body('exercises').isArray().notEmpty(),
], async (req, res) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
	}

	const {date, comments, scheduled_time, exercises } = req.body; // Include scheduled_time
	const workout = await Workout.create({ 
			user_id: req.user.id, 
			date: new Date().toISOString(), 
			comments, 
			scheduled_time // Save scheduled_time
	});

	for (const exercise of exercises) {
			await WorkoutExercise.create({
					workout_id: workout.id,
					exercise_id: exercise.exercise_id,
					sets: exercise.sets,
					repetitions: exercise.repetitions,
					weight: exercise.weight,
			});
	}

	res.status(201).json(workout);
});

// Update Workout
app.put('/api/workouts/:id', authenticateJWT, [
	body('date').isISO8601().optional(),
	body('comments').isString().optional(),
	body('scheduled_time').isISO8601().optional(), // New field for scheduled time
	body('exercises').isArray().optional(), // Accept exercises as an array
], async (req, res) => {
	const errors = validationResult(req);
	if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
	}

	const { date, comments, scheduled_time, exercises } = req.body; // Include scheduled_time and exercises
	const workout = await Workout.findOne({ where: { id: req.params.id, user_id: req.user.id } });

	if (workout) {
			if (date) workout.date = date;
			if (comments) workout.comments = comments;
			if (scheduled_time) workout.scheduled_time = scheduled_time; // Update scheduled_time
			await workout.save();

			// Update exercises
			// First, remove all existing exercises for this workout
			await WorkoutExercise.destroy({ where: { workout_id: workout.id } });

			// Then, add the new exercises
			for (const exercise of exercises) {
					await WorkoutExercise.create({
							workout_id: workout.id,
							exercise_id: exercise.exercise_id, // Assuming exercise_id is passed in the request
							sets: exercise.sets || 0, // Default to 0 if not provided
							repetitions: exercise.repetitions || 0, // Default to 0 if not provided
							weight: exercise.weight || 0, // Default to 0 if not provided
					});
			}

			res.json(workout);
	} else {
			res.status(404).json({ message: 'Workout not found' });
	}
});

// List Workouts
app.get('/api/workouts', authenticateJWT, async (req, res) => {
	try {
			const workouts = await Workout.findAll({
					where: {
							user_id: req.user.id,
							scheduled_time: {
									[Op.gte]: new Date() // Filter for active or pending workouts
							}
					},
					include: [{
							model: WorkoutExercise,
							include: [Exercise] // Include the Exercise model
					}],
					order: [['scheduled_time', 'ASC']], // Sort by scheduled_time in ascending order
			});
			res.json(workouts);
	} catch (error) {
			console.error('Error fetching workouts:', error);
			res.status(500).json({ message: 'Internal Server Error' });
	}
});

// Delete Workout
app.delete('/api/workouts/:id', authenticateJWT, async (req, res) => {
    try {
        const workout = await Workout.findOne({ where: { id: req.params.id, user_id: req.user.id } });
        
        if (workout) {
            await WorkoutExercise.destroy({ where: { workout_id: workout.id } });
            await workout.destroy();
            res.status(204).json({ message: 'Workout deleted successfully' });
        } else {
            res.status(404).json({ message: 'Workout not found' });
        }
    } catch (error) {
        console.error('Error deleting workout:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// Generate Reports
app.get('/api/reports', authenticateJWT, async (req, res) => {
	try {
			const workouts = await Workout.findAll({
					where: { user_id: req.user.id },
					include: [{ model: WorkoutExercise, include: [Exercise] }]
			});

			const totalWorkouts = workouts.length;
			const totalExercises = workouts.reduce((sum, workout) => sum + workout.workout_exercises.length, 0);

			// Example of calculating the most common exercises
			const exerciseCount = {};
			workouts.forEach(workout => {
					workout.workout_exercises.forEach(we => {
							const exerciseName = we.exercise.name;
							exerciseCount[exerciseName] = (exerciseCount[exerciseName] || 0) + 1;
					});
			});

			const mostCommonExercises = Object.entries(exerciseCount)
					.sort((a, b) => b[1] - a[1]) // Sort by count descending
					.slice(0, 5); // Get top 5 exercises

			const report = {
					totalWorkouts,
					totalExercises,
					mostCommonExercises: mostCommonExercises.map(([name, count]) => ({ name, count })),
			};

			res.json(report);
	} catch (error) {
			console.error('Error generating report:', error);
			res.status(500).json({ message: 'Internal Server Error' });
	}
});

// Sync Database and Start Server
const startServer = async () => {
    await sequelize.sync();
    const server = app.listen(3000, () => {
        console.log('Server is running on http://localhost:3000');
    });
    return server; // Return the server instance
};

if (require.main === module) {
	startServer();
}


// Error handling middleware should be the last middleware
app.use(errorHandler);

// Export the app and start the server
module.exports = { app, startServer };