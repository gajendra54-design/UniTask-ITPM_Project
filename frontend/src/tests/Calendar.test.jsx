import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Calendar from '../pages/Calendar';
import axios from 'axios';

const mockNavigate = vi.fn();

// Mock Drag and Drop
vi.mock('react-dnd', async () => ({
  useDrag: () => [{ isDragging: false }, vi.fn()],
  useDrop: () => [{ isOver: false }, vi.fn()],
  DndProvider: ({ children }) => <div>{children}</div>
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('axios');

// Provide responsive observers
window.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Provide localStorage for auth header
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(() => JSON.stringify({ token: 'test-token' })),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  },
  writable: true
});

const getTodayKey = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const createGetMock = ({
  calendarTasks = [
    {
      _id: '1',
      title: 'Initial Test Task',
      date: getTodayKey() + "T12:00:00",
      time: '12:00',
      type: 'deadline',
      status: 'Pending',
      estimatedHours: 2,
    }
  ],
  assignments = [],
} = {}) => vi.fn((url) => {
  if (url === '/api/calendar') {
    return Promise.resolve({ data: calendarTasks });
  }

  if (url === '/api/assignments') {
    return Promise.resolve({ data: assignments });
  }

  return Promise.reject(new Error(`Unexpected GET request: ${url}`));
});

describe('Calendar Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockReset();

    axios.get.mockImplementation(createGetMock());
    axios.post.mockResolvedValue({ data: {} });
  });

  it('renders the calendar and fetches tasks', async () => {
    render(<Calendar />);
    expect(screen.getByPlaceholderText('Search assignments...')).toBeInTheDocument();

    // Wait for the calendar UI to mount globally
    expect(await screen.findByText(/TODAY/i)).toBeInTheDocument();
  });

  it('filters tasks by search string gracefully', async () => {
    render(<Calendar />);
    expect(await screen.findByText(/TODAY/i)).toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText('Search assignments...');
    fireEvent.change(searchInput, { target: { value: 'Non-existent Task' } });

    // The filter shouldn't crash
    expect(screen.getByPlaceholderText('Search assignments...').value).toBe('Non-existent Task');
  });

  it('validates form inputs for task creation', async () => {
    render(<Calendar />);
    expect(await screen.findByText(/TODAY/i)).toBeInTheDocument();

    // Switch to week view 
    const weekButton = screen.getByText('week', { selector: 'button' });
    fireEvent.click(weekButton);

    // Find the add buttons (dashed slots)
    const addButtons = document.querySelectorAll('.border-dashed');
    fireEvent.click(addButtons[0]);

    // Modal opens
    expect(await screen.findByText('SCHEDULE NEW TASK')).toBeInTheDocument();

    // Submit empty to trigger native validation
    const createBtn = screen.getByText('CREATE TASK');
    fireEvent.click(createBtn);

    expect(await screen.findByText('Task title is required.')).toBeInTheDocument();
  });

  it('handles limit validations gracefully', async () => {
    axios.get.mockImplementation(createGetMock({
      calendarTasks: [
        { _id: '1', title: 'Task 1', date: getTodayKey() + "T10:00:00", time: '10:00', type: 'deadline', estimatedHours: 2 },
        { _id: '2', title: 'Task 2', date: getTodayKey() + "T11:00:00", time: '11:00', type: 'deadline', estimatedHours: 2 },
        { _id: '3', title: 'Task 3', date: getTodayKey() + "T12:00:00", time: '12:00', type: 'deadline', estimatedHours: 2 },
      ],
    }));

    render(<Calendar />);
    expect(await screen.findByText(/TODAY/i)).toBeInTheDocument();

    // Use week view to open modal
    const weekButton = screen.getByText('week', { selector: 'button' });
    fireEvent.click(weekButton);

    // Click any dashed add slot
    const addButtons = document.querySelectorAll('.border-dashed');
    fireEvent.click(addButtons[0]);

    expect(await screen.findByText('SCHEDULE NEW TASK')).toBeInTheDocument();

    // Fill in title
    const titleInput = screen.getByPlaceholderText('Enter task title');
    fireEvent.change(titleInput, { target: { value: 'Task 4 to exceed limit' } });

    // Change the date input to TODAY so the limit check applies
    const dateInputs = document.querySelectorAll('input[type="date"]');
    if (dateInputs.length > 0) {
      fireEvent.change(dateInputs[0], { target: { value: getTodayKey() } });
    }

    // Set time
    const timeInputs = document.querySelectorAll('input[type="time"]');
    if (timeInputs.length > 0) {
      fireEvent.change(timeInputs[0], { target: { value: '14:00' } });
    }

    const createBtn = screen.getByText('CREATE TASK');
    fireEvent.click(createBtn);

    // The limit validation should block the API call
    await waitFor(() => {
      expect(axios.post).not.toHaveBeenCalled();
    });
  });

  it('shows AI assignment deadlines on the matching calendar date', async () => {
    const assignmentDeadline = getTodayKey();

    axios.get.mockImplementation(createGetMock({
      calendarTasks: [],
      assignments: [
        {
          _id: 'assignment-1',
          title: 'AI Analysis Assignment',
          deadline: assignmentDeadline,
          totalEstimatedHours: 6,
          subtaskCount: 4,
          completed: 2,
        },
      ],
    }));

    render(<Calendar />);

    const heading = await screen.findByRole('heading', { name: 'AI Analysis Assignment' });
    const card = within(heading.parentElement);
    expect(screen.getByText('1 event scheduled')).toBeInTheDocument();
    expect(card.getByText(/SYNCED/i)).toBeInTheDocument();
    expect(card.getByText('6h')).toBeInTheDocument();
    expect(card.getByText('50%')).toBeInTheDocument();
  });

  it('navigates to assignment details when an AI assignment is clicked', async () => {
    axios.get.mockImplementation(createGetMock({
      calendarTasks: [],
      assignments: [
        {
          _id: 'assignment-99',
          title: 'Linked AI Assignment',
          deadline: getTodayKey(),
          totalEstimatedHours: 3,
          subtaskCount: 3,
          completed: 1,
        },
      ],
    }));

    render(<Calendar />);

    fireEvent.click(await screen.findByRole('heading', { name: 'Linked AI Assignment' }));

    expect(mockNavigate).toHaveBeenCalledWith('/assignments/assignment-99');
  });
});
