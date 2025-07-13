import { weeklyPlanApi } from "@/api/weeklyPlanApi";
import { userProfileApi } from "@/api/userProfileApi";
import { format, startOfWeek } from "date-fns";

/**
 * Get the planned calories for a specific date
 * @param {string} userEmail - User's email
 * @param {Date} date - The date to get calories for
 * @returns {Promise<number>} - Planned calories for that day
 */
export const getPlannedCaloriesForDate = async (userEmail, date) => {
  try {
    // Get the start of the week for this date
    const weekStart = startOfWeek(date, { weekStartsOn: 0 }); // Sunday start
    const weekStartStr = format(weekStart, 'yyyy-MM-dd');
    
    // Find the weekly plan
    const weeklyPlans = await weeklyPlanApi.filter({
      created_by: userEmail,
      week_start_date: weekStartStr
    });
    
    if (weeklyPlans.length > 0) {
      const plan = weeklyPlans[0];
      const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
      
      // Map day numbers to plan properties
      const dayMapping = {
        0: 'sunday_calories',    // Sunday
        1: 'monday_calories',    // Monday
        2: 'tuesday_calories',   // Tuesday  
        3: 'wednesday_calories', // Wednesday
        4: 'thursday_calories',  // Thursday
        5: 'friday_calories',    // Friday
        6: 'saturday_calories'   // Saturday
      };
      
      const dayKey = dayMapping[dayOfWeek];
      return plan[dayKey] || 0;
    }
    
    // If no weekly plan exists, fall back to user's default daily calories
    const userProfiles = await userProfileApi.filter({ created_by: userEmail });
    if (userProfiles.length > 0) {
      return userProfiles[0].daily_calories || 0;
    }
    
    return 0;
  } catch (error) {
    console.error("Error getting planned calories:", error);
    return 0;
  }
};