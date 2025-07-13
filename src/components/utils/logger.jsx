import { appLogApi } from '@/api/appLogApi';
import { userApi } from '@/api/userApi';
import { demoMode } from '@/utils/demoMode';
import { supabase } from '@/api/supabaseClient';

let currentUser = null;

const getCurrentUser = async () => {
    if (currentUser) return currentUser;
    
    try {
        // Check if user is authenticated first
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return null; // Not authenticated
        }
        
        // Return user email directly from auth to avoid RLS issues
        currentUser = { 
            email: user.email, 
            full_name: user.user_metadata?.full_name || 'User' 
        };
        return currentUser;
    } catch (error) {
        console.warn('Failed to get current user for logging:', error);
        return null;
    }
};

/**
 * Logs an event to the AppLog entity.
 * @param {string} page - The name of the page/component where the event occurred.
 * @param {string} action - A specific action identifier (e.g., 'CLICK_SAVE').
 * @param {object} [details={}] - An object containing any relevant data to log.
 * @param {'INFO' | 'WARN' | 'ERROR'} [level='INFO'] - The log level.
 */
export const logEvent = async (page, action, details = {}, level = 'INFO') => {
  try {
    // Skip logging in demo mode to avoid database errors
    if (demoMode.isEnabled()) {
      console.log(`[DEMO LOG] ${page} - ${action}:`, details);
      return;
    }

    let userEmail = 'anonymous';
    
    try {
      const user = await getCurrentUser();
      if (user && user.email) {
        userEmail = user.email;
      } else {
        // User not authenticated yet (e.g., during registration)
        console.log(`[AUTH LOG] ${page} - ${action}:`, details);
        return;
      }
    } catch (error) {
      // User not authenticated yet (e.g., during registration)
      console.log(`[AUTH LOG] ${page} - ${action}:`, details);
      return;
    }
    
    // Avoid logging sensitive data like passwords, tokens etc.
    const sanitizedDetails = { ...details };
    if (sanitizedDetails.password) delete sanitizedDetails.password;
    if (sanitizedDetails.confirmPassword) delete sanitizedDetails.confirmPassword;
    if (sanitizedDetails.token) delete sanitizedDetails.token;
    if (sanitizedDetails.access_token) delete sanitizedDetails.access_token;
    
    await appLogApi.create({
      page,
      action,
      details: JSON.stringify(sanitizedDetails),
      log_level: level,
      user_email: userEmail,
    });
  } catch (error) {
    // Fail silently. We don't want logging to break the app.
    console.error('Failed to write log:', error);
  }
};