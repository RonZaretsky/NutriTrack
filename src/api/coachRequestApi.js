import { supabase, withTimeout } from './supabaseClient';

// CoachRequest API wrapper for Supabase
export const coachRequestApi = {
  // Get coach requests by trainee email
  async getByTrainee(traineeEmail) {
    try {
      const { data, error } = await supabase
        .from('coach_requests')
        .select('*')
        .eq('trainee_email', traineeEmail)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching coach requests by trainee:', error);
      return [];
    }
  },

  // Get coach requests by coach email
  async getByCoach(coachEmail) {
    try {
      const { data, error } = await supabase
        .from('coach_requests')
        .select('*')
        .eq('coach_email', coachEmail)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching coach requests by coach:', error);
      return [];
    }
  },

  // Get pending coach requests
  async getPendingRequests() {
    try {
      const { data, error } = await supabase
        .from('coach_requests')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching pending coach requests:', error);
      return [];
    }
  },

  // Check if request exists between coach and trainee
  async checkRequest(coachEmail, traineeEmail) {
    try {
      const { data, error } = await supabase
        .from('coach_requests')
        .select('*')
        .eq('coach_email', coachEmail)
        .eq('trainee_email', traineeEmail)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
      return data || null;
    } catch (error) {
      console.error('Error checking coach request:', error);
      return null;
    }
  },

  // Create new coach request
  async create(requestData) {
    try {
      const { data, error } = await supabase
        .from('coach_requests')
        .insert([requestData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating coach request:', error);
      throw error;
    }
  },

  // Update coach request status
  async update(id, updates) {
    try {
      const { data, error } = await supabase
        .from('coach_requests')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating coach request:', error);
      throw error;
    }
  },

  // Delete coach request
  async delete(id) {
    try {
      const { error } = await supabase
        .from('coach_requests')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting coach request:', error);
      throw error;
    }
  },

  // Delete coach request by coach and trainee
  async deleteByCoachAndTrainee(coachEmail, traineeEmail) {
    try {
      const { error } = await supabase
        .from('coach_requests')
        .delete()
        .eq('coach_email', coachEmail)
        .eq('trainee_email', traineeEmail);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting coach request by coach and trainee:', error);
      throw error;
    }
  },

  // Filter coach requests
  async filter(filters = {}) {
    try {
      let query = supabase.from('coach_requests').select('*');
      
      // Apply filters
      if (filters.coach_email) {
        query = query.eq('coach_email', filters.coach_email);
      }
      if (filters.trainee_email) {
        query = query.eq('trainee_email', filters.trainee_email);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      
      // Add ordering
      query = query.order('created_at', { ascending: false });
      
      const { data, error } = await withTimeout(query);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error filtering coach requests:', error);
      // Return empty array on timeout or error
      return [];
    }
  }
}; 