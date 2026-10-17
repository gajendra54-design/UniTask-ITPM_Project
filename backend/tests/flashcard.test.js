import request from 'supertest';
import express from 'express';

const app = express();
app.use(express.json());

// Simple route mock for testing
app.get('/api/flashcards', (req, res) => {
    res.status(200).json({ success: true, data: [] });
});

app.post('/api/flashcards', (req, res) => {
    const { title } = req.body;
    if (!title) return res.status(400).json({ error: 'Title required' });
    res.status(201).json({ success: true, title });
});

describe('Flashcard API Tests', () => {
    test('GET /api/flashcards - should return 200', async () => {
        const res = await request(app).get('/api/flashcards');
        expect(res.statusCode).toBe(200);
        expect(res.body.success).toBe(true);
    });

    test('POST /api/flashcards - should create with title', async () => {
        const res = await request(app)
            .post('/api/flashcards')
            .send({ title: 'NDM' });
        expect(res.statusCode).toBe(201);
        expect(res.body.title).toBe('NDM');
    });

    test('POST /api/flashcards - should fail without title', async () => {
        const res = await request(app)
            .post('/api/flashcards')
            .send({});
        expect(res.statusCode).toBe(400);
    });
});