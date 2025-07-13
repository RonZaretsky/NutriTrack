import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { authApi } from '@/api/authApi';
import { logEvent } from '@/components/utils/logger';
import { demoMode } from '@/utils/demoMode';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [isCoach, setIsCoach] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Refs to prevent infinite loops and track state
  const initializedRef = useRef(false);
  const isInitializingRef = useRef(true);
  const authSubscriptionRef = useRef(null);
  const lastAuthStateRef = useRef(null);
  const loadingTimeoutRef = useRef(null);
  const listenerSetupRef = useRef(false);
  const roleFetchedRef = useRef(false);

  // Monitor state changes for debugging (only in development)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Auth state updated:', { 
        loading, 
        isAuthenticated, 
        user: !!user,
        userRole,
        isCoach,
        isAdmin
      });
    }
  }, [loading, isAuthenticated, user, userRole, isCoach, isAdmin]);

  // Initialize auth state
  useEffect(() => {
    // Prevent multiple initializations
    if (initializedRef.current) {
      console.log('Auth already initialized, skipping');
      return;
    }

    // Mark as initializing to prevent race conditions
    isInitializingRef.current = true;

    // Set up auth state change listener
    const setupAuthListener = () => {
      if (demoMode.isEnabled()) {
        console.log('Demo mode enabled, skipping auth state change listener');
        return;
      }

      if (listenerSetupRef.current) {
        console.log('Auth state change listener already set up, skipping');
        return;
      }

      console.log('Setting up auth state change listener');
      try {
        const { data: { subscription } } = authApi.onAuthStateChange(async (event, session) => {
          console.log('Auth state changed:', event, session?.user?.email);
          
          // Skip if still initializing (but allow SIGNED_IN events during initialization)
          if (isInitializingRef.current && event !== 'SIGNED_IN') {
            console.log('Skipping auth state change - still initializing (event:', event, ')');
            return;
          }
          
          // Skip INITIAL_SESSION events as they're handled during initialization
          if (event === 'INITIAL_SESSION') {
            console.log('Skipping INITIAL_SESSION event - already handled during initialization');
            return;
          }
          
          // Prevent duplicate state updates
          const currentAuthState = JSON.stringify({ event, session: session?.user?.id });
          if (lastAuthStateRef.current === currentAuthState) {
            console.log('Skipping duplicate auth state change');
            return;
          }
          lastAuthStateRef.current = currentAuthState;
          
          // Update session state
          setSession(prevSession => {
            if (JSON.stringify(prevSession) !== JSON.stringify(session)) {
              return session;
            }
            return prevSession;
          });
          
          // Update user state
          setUser(prevUser => {
            const newUser = session?.user || null;
            if (JSON.stringify(prevUser) !== JSON.stringify(newUser)) {
              return newUser;
            }
            return prevUser;
          });
          
          // Update authentication state
          setIsAuthenticated(prevAuth => {
            const newAuth = !!session;
            if (prevAuth !== newAuth) {
              return newAuth;
            }
            return prevAuth;
          });
          
          // Set loading to false when we have a session
          if (session) {
            setLoading(false);
            console.log('Setting loading to false due to auth state change');
          }
          
          // Update user role and status if we have a user and haven't fetched roles yet
          if (session?.user && !roleFetchedRef.current && event === 'SIGNED_IN') {
            console.log('Getting user role/status for:', session.user.email);
            
            // Use Promise.allSettled to handle all role requests with timeout
            const roleTimeout = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Role fetch timeout')), 5000)
            );
            
            Promise.race([
              Promise.allSettled([
                authApi.getUserRole(),
                authApi.isCoach(),
                authApi.isAdmin()
              ]),
              roleTimeout
            ]).then((results) => {
              const [roleResult, coachResult, adminResult] = results;
              
              const role = roleResult.status === 'fulfilled' ? roleResult.value : 'user';
              const coachStatus = coachResult.status === 'fulfilled' ? coachResult.value : false;
              const adminStatus = adminResult.status === 'fulfilled' ? adminResult.value : false;
              
              console.log('Role/status results:', { role, coachStatus, adminStatus });
              
              setUserRole(role);
              setIsCoach(coachStatus);
              setIsAdmin(adminStatus);
              roleFetchedRef.current = true;
              
              logEvent('Auth', 'AUTH_STATE_CHANGED', { 
                event,
                userId: session.user.id,
                role,
                isCoach: coachStatus,
                isAdmin: adminStatus
              });
            }).catch((error) => {
              console.error('Error getting user role/status:', error);
              // Set default values if there's an error
              setUserRole('user');
              setIsCoach(false);
              setIsAdmin(false);
              roleFetchedRef.current = true;
            });
          } else if (!session?.user) {
            setUserRole(null);
            setIsCoach(false);
            setIsAdmin(false);
            roleFetchedRef.current = false;
            
            logEvent('Auth', 'AUTH_STATE_CHANGED', { event: 'SIGNED_OUT' });
          }
        });

        authSubscriptionRef.current = subscription;
        listenerSetupRef.current = true;
        console.log('Auth state change listener set up successfully');
      } catch (error) {
        console.error('Error setting up auth state change listener:', error);
      }
    };

    const initializeAuth = async () => {
      try {
        console.log('=== AUTH INITIALIZATION START ===');
        console.log('Demo mode enabled:', demoMode.isEnabled());
        
        // Check if demo mode is enabled
        if (demoMode.isEnabled()) {
          const demoRole = localStorage.getItem('nutri-track-demo-role');
          let demoUser;
          
          if (demoRole === 'admin') {
            demoUser = demoMode.getDemoAdminUser();
          } else if (demoRole === 'coach') {
            demoUser = demoMode.getDemoCoachUser();
          } else {
            demoUser = demoMode.getDemoUser();
          }
          
          setUser(demoUser);
          setSession({ user: demoUser });
          setIsAuthenticated(true);
          setUserRole(demoUser.role);
          setIsCoach(demoUser.is_coach);
          setIsAdmin(demoUser.role === 'admin');
          setLoading(false);
          
          logEvent('Auth', 'DEMO_MODE_ENABLED', { 
            userId: demoUser.id,
            role: demoUser.role,
            isCoach: demoUser.is_coach,
            isAdmin: demoUser.role === 'admin'
          });
        } else {
          console.log('Real auth mode - getting session and user');
          const currentSession = await authApi.getSession();
          const currentUser = await authApi.getCurrentUser();
          
          console.log('Current session:', !!currentSession);
          console.log('Current user:', !!currentUser);
          
          setSession(currentSession);
          setUser(currentUser);
          setIsAuthenticated(!!currentSession);
          
          if (currentUser) {
            console.log('Getting user role/status during initialization for:', currentUser.email);
            
            // Use Promise.allSettled with timeout for initialization role fetching
            const roleTimeout = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Role fetch timeout')), 5000)
            );
            
            Promise.race([
              Promise.allSettled([
                authApi.getUserRole(),
                authApi.isCoach(),
                authApi.isAdmin()
              ]),
              roleTimeout
            ]).then((results) => {
              const [roleResult, coachResult, adminResult] = results;
              
              const role = roleResult.status === 'fulfilled' ? roleResult.value : 'user';
              const coachStatus = coachResult.status === 'fulfilled' ? coachResult.value : false;
              const adminStatus = adminResult.status === 'fulfilled' ? adminResult.value : false;
              
              setUserRole(role);
              setIsCoach(coachStatus);
              setIsAdmin(adminStatus);
              roleFetchedRef.current = true;
              
              logEvent('Auth', 'SESSION_RESTORED', { 
                userId: currentUser.id,
                role,
                isCoach: coachStatus,
                isAdmin: adminStatus
              });
            }).catch((error) => {
              console.error('Error getting user role/status during init:', error);
              // Set default values if there's an error
              setUserRole('user');
              setIsCoach(false);
              setIsAdmin(false);
              roleFetchedRef.current = true;
            });
          }
          
          // Set loading to false after all initialization is complete
          setLoading(false);
          console.log('Setting loading to false after initialization complete');
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        logEvent('Auth', 'INIT_ERROR', { error: error.message }, 'ERROR');
        setLoading(false);
      } finally {
        console.log('Auth initialization complete');
        initializedRef.current = true;
        isInitializingRef.current = false;
      }
    };

    // Initialize auth first, then set up listener
    const initPromise = initializeAuth();
    
    // Set up auth state change listener immediately but with proper guards
    setupAuthListener();
    
    // Wait for initialization to complete
    initPromise.then(() => {
      console.log('Initialization complete, auth listener should be ready');
    }).catch((error) => {
      console.error('Auth initialization failed:', error);
    });

    // Fallback timeout to ensure loading doesn't get stuck
    loadingTimeoutRef.current = setTimeout(() => {
      console.log('Loading timeout reached, forcing loading to false');
      setLoading(false);
      initializedRef.current = true;
      isInitializingRef.current = false;
    }, 10000); // 10 seconds timeout

    // Cleanup function
    return () => {
      console.log('AuthContext cleanup - cleaning up subscriptions and timeouts');
      
      // Clear timeout
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
      
      // Unsubscribe from auth state changes
      if (authSubscriptionRef.current) {
        console.log('Unsubscribing from auth state changes');
        authSubscriptionRef.current.unsubscribe();
        authSubscriptionRef.current = null;
      }
      
      // Reset refs
      initializedRef.current = false;
      isInitializingRef.current = true;
      lastAuthStateRef.current = null;
      listenerSetupRef.current = false;
      roleFetchedRef.current = false;
    };
  }, []); // Empty dependency array - only run once

  // Sign in
  const signIn = async (email, password) => {
    try {
      if (demoMode.isEnabled()) {
        // Demo mode - simulate successful login
        const demoRole = localStorage.getItem('nutri-track-demo-role');
        let demoUser;
        
        if (demoRole === 'admin') {
          demoUser = demoMode.getDemoAdminUser();
        } else if (demoRole === 'coach') {
          demoUser = demoMode.getDemoCoachUser();
        } else {
          demoUser = demoMode.getDemoUser();
        }
        
        setUser(demoUser);
        setSession({ user: demoUser });
        setIsAuthenticated(true);
        setUserRole(demoUser.role);
        setIsCoach(demoUser.is_coach);
        setIsAdmin(demoUser.role === 'admin');
        
        logEvent('Auth', 'DEMO_SIGN_IN_SUCCESS', { email });
        return { user: demoUser };
      } else {
        const result = await authApi.signIn(email, password);
        logEvent('Auth', 'SIGN_IN_SUCCESS', { method: 'email_password' });
        return result;
      }
    } catch (error) {
      logEvent('Auth', 'SIGN_IN_ERROR', { error: error.message }, 'ERROR');
      throw error;
    }
  };

  // Sign up
  const signUp = async (email, password, fullName) => {
    try {
      const result = await authApi.signUp(email, password, fullName);
      logEvent('Auth', 'SIGN_UP_SUCCESS', { email });
      return result;
    } catch (error) {
      logEvent('Auth', 'SIGN_UP_ERROR', { error: error.message }, 'ERROR');
      throw error;
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      if (demoMode.isEnabled()) {
        // Demo mode - clear user state
        setUser(null);
        setSession(null);
        setIsAuthenticated(false);
        setUserRole(null);
        setIsCoach(false);
        setIsAdmin(false);
        
        logEvent('Auth', 'DEMO_SIGN_OUT_SUCCESS');
      } else {
        await authApi.signOut();
        logEvent('Auth', 'SIGN_OUT_SUCCESS');
      }
    } catch (error) {
      logEvent('Auth', 'SIGN_OUT_ERROR', { error: error.message }, 'ERROR');
      throw error;
    }
  };

  // Magic link sign in
  const signInWithMagicLink = async (email) => {
    try {
      const result = await authApi.signInWithMagicLink(email);
      logEvent('Auth', 'MAGIC_LINK_SENT', { email });
      return result;
    } catch (error) {
      logEvent('Auth', 'MAGIC_LINK_ERROR', { error: error.message }, 'ERROR');
      throw error;
    }
  };

  // Reset password
  const resetPassword = async (email) => {
    try {
      const result = await authApi.resetPassword(email);
      logEvent('Auth', 'PASSWORD_RESET_REQUESTED', { email });
      return result;
    } catch (error) {
      logEvent('Auth', 'PASSWORD_RESET_ERROR', { error: error.message }, 'ERROR');
      throw error;
    }
  };

  // Update password
  const updatePassword = async (newPassword) => {
    try {
      const result = await authApi.updatePassword(newPassword);
      logEvent('Auth', 'PASSWORD_UPDATED');
      return result;
    } catch (error) {
      logEvent('Auth', 'PASSWORD_UPDATE_ERROR', { error: error.message }, 'ERROR');
      throw error;
    }
  };

  // Update profile
  const updateProfile = async (updates) => {
    try {
      const result = await authApi.updateProfile(updates);
      logEvent('Auth', 'PROFILE_UPDATED', { updates });
      return result;
    } catch (error) {
      logEvent('Auth', 'PROFILE_UPDATE_ERROR', { error: error.message }, 'ERROR');
      throw error;
    }
  };

  const value = {
    user,
    session,
    loading,
    isAuthenticated,
    userRole,
    isCoach,
    isAdmin,
    signIn,
    signUp,
    signOut,
    signInWithMagicLink,
    resetPassword,
    updatePassword,
    updateProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 