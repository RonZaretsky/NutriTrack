import { supabase } from './supabaseClient';

// AppLog API wrapper for Supabase
export const appLogApi = {
  // Get logs by user email
  async getByUser(email, limit = 100) {
    try {
      const { data, error } = await supabase
        .from('app_logs')
        .select('*')
        .eq('user_email', email)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching app logs:', error);
      return [];
    }
  },

  // Get logs by page/action
  async getByPage(page, limit = 50) {
    try {
      const { data, error } = await supabase
        .from('app_logs')
        .select('*')
        .eq('page', page)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching app logs by page:', error);
      return [];
    }
  },

  // Get logs by log level
  async getByLevel(level, limit = 100) {
    try {
      const { data, error } = await supabase
        .from('app_logs')
        .select('*')
        .eq('log_level', level)
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching app logs by level:', error);
      return [];
    }
  },

  // Get all logs (for admin use)
  async getAll(limit = 200) {
    try {
      const { data, error } = await supabase
        .from('app_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching all app logs:', error);
      return [];
    }
  },

  // Create new log entry
  async create(logData) {
    try {
      const { data, error } = await supabase
        .from('app_logs')
        .insert([logData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating app log:', error);
      throw error;
    }
  },

  // Delete log entry
  async delete(id) {
    try {
      const { error } = await supabase
        .from('app_logs')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting app log:', error);
      throw error;
    }
  },

  // Delete old logs (cleanup)
  async deleteOldLogs(daysOld = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      
      const { error } = await supabase
        .from('app_logs')
        .delete()
        .lt('created_at', cutoffDate.toISOString());
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting old app logs:', error);
      throw error;
    }
  },

  // Filter logs
  async filter(filters = {}) {
    try {
      let query = supabase.from('app_logs').select('*');
      
      // Apply filters
      if (filters.user_email) {
        query = query.eq('user_email', filters.user_email);
      }
      if (filters.page) {
        query = query.eq('page', filters.page);
      }
      if (filters.action) {
        query = query.eq('action', filters.action);
      }
      if (filters.log_level) {
        query = query.eq('log_level', filters.log_level);
      }
      if (filters.created_at) {
        if (typeof filters.created_at === 'object' && filters.created_at.$gte) {
          query = query.gte('created_at', filters.created_at.$gte);
        } else {
          query = query.eq('created_at', filters.created_at);
        }
      }
      
      // Add ordering
      query = query.order('created_at', { ascending: false });
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error filtering app logs:', error);
      return [];
    }
  }
}; 