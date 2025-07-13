// Demo mode utility for testing without real authentication

const DEMO_MODE_KEY = 'nutri-track-demo-mode';

export const demoMode = {
  // Check if demo mode is enabled
  isEnabled() {
    // In production, never allow demo mode unless explicitly enabled
    if (import.meta.env.VITE_APP_ENV === 'production' && import.meta.env.VITE_DEMO_MODE !== 'true') {
      return false;
    }
    
    return localStorage.getItem(DEMO_MODE_KEY) === 'true' || 
           import.meta.env.VITE_DEMO_MODE === 'true' ||
           import.meta.env.DEMO_MODE === 'true';
  },

  // Enable demo mode
  enable() {
    localStorage.setItem(DEMO_MODE_KEY, 'true');
    console.log('Demo mode enabled');
  },

  // Disable demo mode
  disable() {
    localStorage.removeItem(DEMO_MODE_KEY);
    console.log('Demo mode disabled');
  },

  // Toggle demo mode
  toggle() {
    if (this.isEnabled()) {
      this.disable();
    } else {
      this.enable();
    }
  },

  // Get demo user data
  getDemoUser() {
    return {
      id: 'demo-user-123',
      email: 'demo@example.com',
      full_name: 'Demo User',
      role: 'user',
      is_coach: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  },

  // Get demo admin user data
  getDemoAdminUser() {
    return {
      id: 'demo-admin-123',
      email: 'admin@example.com',
      full_name: 'Demo Admin',
      role: 'admin',
      is_coach: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  },

  // Get demo coach user data
  getDemoCoachUser() {
    return {
      id: 'demo-coach-123',
      email: 'coach@example.com',
      full_name: 'Demo Coach',
      role: 'user',
      is_coach: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }
}; 