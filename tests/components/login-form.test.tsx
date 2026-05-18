import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from '@/components/admin/login-form';
import { useAuthStore } from '@/stores/authStore';
import { routerMock } from '../setup';

describe('LoginForm', () => {
  beforeEach(() => {
    // Zustand stores persist across tests in the same module. Clear so each
    // test starts unauthenticated.
    useAuthStore.getState().clearAuth();
  });

  it('renders email + password fields', () => {
    render(<LoginForm />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /masuk/i })).toBeInTheDocument();
  });

  it('logs in and navigates to /admin on success', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    const email = screen.getByLabelText(/email/i) as HTMLInputElement;
    const password = screen.getByLabelText(/password/i) as HTMLInputElement;

    // Default value is 'admin@local' (matches seed). Clear and retype to
    // exercise the form rather than rely on the default.
    await user.clear(email);
    await user.type(email, 'admin@local');
    await user.type(password, 'admin123');

    await user.click(screen.getByRole('button', { name: /masuk/i }));

    // Router redirect is the observable signal that login completed.
    await screen.findByRole('button', { name: /masuk/i });
    expect(routerMock.push).toHaveBeenCalledWith('/admin');

    // Store should now have the user from MSW handler.
    const state = useAuthStore.getState();
    expect(state.user?.email).toBe('admin@local');
    expect(state.accessToken).toBe('fake-access-token');
  });

  it('shows an inline error on 401 and does not navigate', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.clear(screen.getByLabelText(/email/i));
    await user.type(screen.getByLabelText(/email/i), 'admin@local');
    await user.type(screen.getByLabelText(/password/i), 'wrong-password');

    await user.click(screen.getByRole('button', { name: /masuk/i }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/email atau password salah/i);
    expect(routerMock.push).not.toHaveBeenCalled();
    expect(useAuthStore.getState().user).toBeNull();
  });
});
