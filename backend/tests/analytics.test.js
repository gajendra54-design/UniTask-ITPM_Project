import request from 'supertest';
import express from 'express';

const app = express();
app.use(express.json());

app.get('/api/analytics/tasks', (req, res) => {
    res.status(200).json({ success: true, totalTasks: 24, completed: 5 });
});

app.get('/api/analytics/skills', (req, res) => {
    res.status(200).json({ success: true, consistencyScore: 100 });
});

describe('Analytics API Tests', () => {
    test('GET /api/analytics/tasks - should return task data', async () => {
        const res = await request(app).get('/api/analytics/tasks');
        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body).toHaveProperty('totalTasks');
    });

    test('GET /api/analytics/skills - should return skill data', async () => {
        const res = await request(app).get('/api/analytics/skills');
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('consistencyScore');
    });
});