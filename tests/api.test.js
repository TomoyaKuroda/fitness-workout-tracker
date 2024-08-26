const request = require('supertest');
const { app, startServer } = require('../server');
const sequelize = require('../config/database');

let token;
let server;

beforeAll(async () => {
  await sequelize.sync({ force: true });
  server = await startServer();
});

afterAll(async () => {
  await sequelize.close();
  server.close();
});

describe('API Tests', () => {
  describe('User Authentication', () => {
    it('should sign up a new user', async () => {
      const response = await request(server)
        .post('/api/signup')
        .send({ username: 'testuser', password: 'password123', email: 'test@example.com' });
      expect(response.statusCode).toBe(201);
    });

    it('should log in the user', async () => {
      const response = await request(server)
        .post('/api/login')
        .send({ username: 'testuser', password: 'password123' });
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('token');
      token = response.body.token;
    });
  });

  describe('Exercise Management', () => {
    it('should create a new exercise', async () => {
      const response = await request(server)
        .post('/api/exercises')
        .set('Authorization', token)
        .send({ name: 'Push Up', description: 'A basic push-up exercise', category: 'Strength', muscle_group: 'Chest' });
      expect(response.statusCode).toBe(201);
      expect(response.body).toHaveProperty('id');
    });

    it('should list all exercises', async () => {
      const response = await request(server)
        .get('/api/exercises');
      expect(response.statusCode).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('Workout Management', () => {
    let workoutId;

    const createWorkout = async (data) => {
      const response = await request(server)
        .post('/api/workouts')
        .set('Authorization', token)
        .send(data);
      expect(response.statusCode).toBe(201);
      return response.body.id;
    };

    beforeAll(async () => {
      workoutId = await createWorkout({
        date: new Date().toISOString(),
        comments: 'Leg day',
        scheduled_time: new Date(Date.now() + 3600000).toISOString(),
        exercises: [{ exercise_id: 1, sets: 3, repetitions: 10, weight: 50 }]
      });
    });

    it('should list all workouts', async () => {
      const response = await request(server)
        .get('/api/workouts')
        .set('Authorization', token);
      expect(response.statusCode).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should update the workout', async () => {
      const response = await request(server)
        .put(`/api/workouts/${workoutId}`)
        .set('Authorization', token)
        .send({ comments: 'Updated leg day' });
      expect(response.statusCode).toBe(200);
      expect(response.body.comments).toBe('Updated leg day');
    });

    it('should delete the workout', async () => {
      const response = await request(server)
        .delete(`/api/workouts/${workoutId}`)
        .set('Authorization', token);
      expect(response.statusCode).toBe(204);
    }, 10000);

    it('should create a new workout with scheduled time', async () => {
      const scheduledTime = new Date(Date.now() + 3600000).toISOString();
      const response = await request(server)
        .post('/api/workouts')
        .set('Authorization', token)
        .send({
          date: new Date().toISOString(),
          comments: 'Leg day',
          scheduled_time: scheduledTime,
          exercises: [{ exercise_id: 1, sets: 3, repetitions: 10, weight: 50 }]
        });
      expect(response.statusCode).toBe(201);
      workoutId = response.body.id;

      const createdWorkout = response.body;
      const createdScheduledTime = new Date(createdWorkout.scheduled_time);
      const expectedScheduledTime = new Date(scheduledTime);
      expect(Math.abs(createdScheduledTime - expectedScheduledTime)).toBeLessThan(1000);
    });

    it('should update the workout scheduled time', async () => {
      const scheduledTime = new Date(Date.now() + 3600000).toISOString();
      const response = await request(server)
        .put(`/api/workouts/${workoutId}`)
        .set('Authorization', token)
        .send({ scheduled_time: scheduledTime });
      expect(response.statusCode).toBe(200);
      
      const updatedWorkout = response.body;
      const updatedScheduledTime = new Date(updatedWorkout.scheduled_time);
      const expectedScheduledTime = new Date(scheduledTime);
      expect(Math.abs(updatedScheduledTime - expectedScheduledTime)).toBeLessThan(1000);
    });

    it('should list active workouts sorted by scheduled time', async () => {
      const response = await request(server)
        .get('/api/workouts')
        .set('Authorization', token);
      expect(response.statusCode).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });
  });

  describe('Report Generation', () => {
    it('should generate reports', async () => {
      const response = await request(server)
        .get('/api/reports')
        .set('Authorization', token);
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('totalWorkouts');
      expect(response.body).toHaveProperty('totalExercises');
    });
  });
});