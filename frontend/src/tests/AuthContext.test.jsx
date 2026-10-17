import { act, fireEvent, render, screen, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider, useAuth } from '../context/AuthContext';

function Session() {
  const { user, login, logout, updateUser } = useAuth();
  return <>
    <span>{user?.name || 'signed out'}</span>
    <button onClick={() => login({ token: 'test', user: { name: 'Student' }, expiresAt: Date.now() + 1000 })}>login</button>
    <button onClick={logout}>logout</button>
    <button onClick={() => updateUser({ name: 'Updated' })}>update</button>
  </>;
}

describe('authentication expiry', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
  });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    localStorage.clear();
  });
  it('keeps the expiry deadline across profile updates', () => {
    render(<AuthProvider><Session /></AuthProvider>);
    fireEvent.click(screen.getByText('login'));
    act(() => vi.advanceTimersByTime(500));
    fireEvent.click(screen.getByText('update'));
    expect(screen.getByText('Updated')).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(500));
    expect(screen.getByText('signed out')).toBeInTheDocument();
    expect(localStorage.getItem('auth')).toBeNull();
  });
  it('cleans up the previous timer when a new session starts', () => {
    render(<AuthProvider><Session /></AuthProvider>);
    fireEvent.click(screen.getByText('login'));
    act(() => vi.advanceTimersByTime(500));
    fireEvent.click(screen.getByText('logout'));
    fireEvent.click(screen.getByText('login'));
    act(() => vi.advanceTimersByTime(500));
    expect(screen.getByText('Student')).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(500));
    expect(screen.getByText('signed out')).toBeInTheDocument();
  });
  it('discards an expired saved session', () => {
    localStorage.setItem('auth', JSON.stringify({ token: 'test', user: { name: 'Expired' }, expiresAt: Date.now() - 1 }));
    render(<AuthProvider><Session /></AuthProvider>);
    expect(screen.getByText('signed out')).toBeInTheDocument();
    expect(localStorage.getItem('auth')).toBeNull();
  });
});
