import { jest } from '@jest/globals';
import * as calendarController from '../controllers/calendarController.js';
import CalendarTask from '../models/CalendarTask.js';

// Mock the model methods using spyOn for ESM compatibility
jest.spyOn(CalendarTask, 'find');
jest.spyOn(CalendarTask, 'insertMany');
jest.spyOn(CalendarTask, 'findById');
jest.spyOn(CalendarTask, 'deleteOne');

describe('Calendar Controller', () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      user: { _id: 'mockUserId123' },
      body: {},
      params: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
  });

  describe('getTasks', () => {
    it('should return tasks for the user', async () => {
      const mockTasks = [{ title: 'Task 1' }, { title: 'Task 2' }];
      CalendarTask.find.mockResolvedValue(mockTasks);

      await calendarController.getTasks(req, res);

      expect(CalendarTask.find).toHaveBeenCalledWith({ userId: 'mockUserId123' });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockTasks);
    });

    it('should handle errors', async () => {
      const error = new Error('Database error');
      CalendarTask.find.mockRejectedValue(error);

      await calendarController.getTasks(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ message: 'Database error' });
    });
  });

  describe('createTask', () => {
    it('should create a task when validations pass', async () => {
      req.body = {
        title: 'New Task',
        date: '2026-04-20',
        estimatedHours: 2,
        occurrences: 1
      };
      
      CalendarTask.find.mockResolvedValue([]); // No existing tasks
      const createdTask = { _id: 'task1', ...req.body };
      CalendarTask.insertMany.mockResolvedValue([createdTask]);

      await calendarController.createTask(req, res);

      expect(CalendarTask.find).toHaveBeenCalled();
      expect(CalendarTask.insertMany).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith([createdTask]);
    });

    it('should reject if 3 tasks already exist for the day', async () => {
      req.body = { title: 'New Task', date: '2026-04-20', estimatedHours: 2, occurrences: 1 };
      
      const existingTasks = [{ id: 1 }, { id: 2 }, { id: 3 }];
      CalendarTask.find.mockResolvedValue(existingTasks);

      await calendarController.createTask(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: expect.stringContaining('Max 3 assignments allowed per day')
      });
      expect(CalendarTask.insertMany).not.toHaveBeenCalled();
    });

    it('should reject if new total hours exceed 8 for the day', async () => {
      req.body = { title: 'Large Task', date: '2026-04-20', estimatedHours: 5, occurrences: 1 };
      
      // Existing tasks sum to 4 hours
      const existingTasks = [{ id: 1, estimatedHours: 4 }]; 
      CalendarTask.find.mockResolvedValue(existingTasks);

      await calendarController.createTask(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: expect.stringContaining('Exceeds 8h daily limit')
      });
      expect(CalendarTask.insertMany).not.toHaveBeenCalled();
    });
  });

  describe('updateTask', () => {
    it('should successfully update a task', async () => {
      req.params.id = 'taskId';
      req.body = { estimatedHours: 4 };

      const mockTask = {
        _id: 'taskId',
        userId: 'mockUserId123',
        date: '2026-04-20',
        estimatedHours: 2,
        save: jest.fn().mockResolvedValue({ _id: 'taskId', estimatedHours: 4 })
      };

      CalendarTask.findById.mockResolvedValue(mockTask);
      // No other tasks for that day
      CalendarTask.find.mockResolvedValue([]);

      await calendarController.updateTask(req, res);

      expect(CalendarTask.findById).toHaveBeenCalledWith('taskId');
      expect(mockTask.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ estimatedHours: 4 }));
    });
  });

  describe('deleteTask', () => {
    it('should delete task and return 200', async () => {
      req.params.id = 'taskId';
      const mockTask = { _id: 'taskId', userId: 'mockUserId123' }; // Matches logged in user
      CalendarTask.findById.mockResolvedValue(mockTask);
      CalendarTask.deleteOne.mockResolvedValue({ deletedCount: 1 });

      await calendarController.deleteTask(req, res);

      expect(CalendarTask.findById).toHaveBeenCalledWith('taskId');
      expect(CalendarTask.deleteOne).toHaveBeenCalledWith({ _id: 'taskId' });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: 'Task removed' });
    });

    it('should return 401 if user is not authorized to delete', async () => {
      req.params.id = 'taskId';
      const mockTask = { _id: 'taskId', userId: 'differentUser' }; 
      CalendarTask.findById.mockResolvedValue(mockTask);

      await calendarController.deleteTask(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Not authorized' });
      expect(CalendarTask.deleteOne).not.toHaveBeenCalled();
    });

    it('should return 404 if task not found', async () => {
      req.params.id = 'taskId';
      CalendarTask.findById.mockResolvedValue(null);

      await calendarController.deleteTask(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Task not found' });
    });
  });

});
