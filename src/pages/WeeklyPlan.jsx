
import React, { useState, useEffect } from "react";
import { userApi } from "@/api/userApi";
import { userProfileApi } from "@/api/userProfileApi";
import { weeklyPlanApi } from "@/api/weeklyPlanApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar,
  ChevronLeft,
  ChevronRight,
  Target,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Save,
  Copy,
  RefreshCcw
} from "lucide-react";
import { format, startOfWeek, addWeeks, subWeeks, addDays, isToday } from "date-fns";
import { he } from "date-fns/locale";
import { logEvent } from '@/components/utils/logger';

export default function WeeklyPlanPage() {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date(), { weekStartsOn: 0 })); // Sunday start
  const [weeklyPlan, setWeeklyPlan] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const dayKeys = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

  useEffect(() => {
    logEvent('WeeklyPlan', 'PAGE_LOAD');
    loadData();
  }, [currentWeek]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const currentUser = await userApi.me();
      setUser(currentUser);

      const profiles = await userProfileApi.filter({ created_by: currentUser.email });
      if (profiles.length === 0) {
        // Redirect to profile setup if no profile exists
        window.location.href = '/Profile';
        return;
      }
      const profile = profiles[0];
      setUserProfile(profile);

      await loadWeeklyPlan(currentUser.email, profile.daily_calories);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadWeeklyPlan = async (userEmail, defaultCalories) => {
    const weekStartStr = format(currentWeek, 'yyyy-MM-dd');
    
    try {
      // Try to find existing plan for this week
      const existingPlans = await weeklyPlanApi.filter({
        created_by: userEmail,
        week_start_date: weekStartStr
      });

      if (existingPlans.length > 0) {
        setWeeklyPlan(existingPlans[0]);
        setHasUnsavedChanges(false);
        return;
      }

      // No plan for this week, create default based on previous week or profile default
      const previousWeek = subWeeks(currentWeek, 1);
      const previousWeekStr = format(previousWeek, 'yyyy-MM-dd');
      
      const previousPlans = await weeklyPlanApi.filter({
        created_by: userEmail,
        week_start_date: previousWeekStr
      });

      let defaultPlan;
      if (previousPlans.length > 0) {
        // Copy from previous week
        const prevPlan = previousPlans[0];
        defaultPlan = {
          week_start_date: weekStartStr,
          sunday_calories: prevPlan.sunday_calories,
          monday_calories: prevPlan.monday_calories,
          tuesday_calories: prevPlan.tuesday_calories,
          wednesday_calories: prevPlan.wednesday_calories,
          thursday_calories: prevPlan.thursday_calories,
          friday_calories: prevPlan.friday_calories,
          saturday_calories: prevPlan.saturday_calories
        };
      } else {
        // Use profile default for all days
        defaultPlan = {
          week_start_date: weekStartStr,
          sunday_calories: defaultCalories,
          monday_calories: defaultCalories,
          tuesday_calories: defaultCalories,
          wednesday_calories: defaultCalories,
          thursday_calories: defaultCalories,
          friday_calories: defaultCalories,
          saturday_calories: defaultCalories
        };
      }

      setWeeklyPlan(defaultPlan);
      setHasUnsavedChanges(true);
    } catch (error) {
      console.error("Error loading weekly plan:", error);
    }
  };

  const handleCalorieChange = (day, value) => {
    const numValue = parseInt(value) || 0;
    setWeeklyPlan(prev => ({
      ...prev,
      [`${day}_calories`]: numValue
    }));
    setHasUnsavedChanges(true);
    logEvent('WeeklyPlan', 'CALORIE_CHANGE', { day, value: numValue });
  };

  const handleSave = async () => {
    if (!weeklyPlan || !hasUnsavedChanges) return;
    
    setIsSaving(true);
    try {
              if (weeklyPlan.id) {
          // Update existing plan
          await weeklyPlanApi.update(weeklyPlan.id, weeklyPlan);
        } else {
          // Create new plan
          const created = await weeklyPlanApi.create(weeklyPlan);
        setWeeklyPlan(created);
      }
      
      setHasUnsavedChanges(false);
      logEvent('WeeklyPlan', 'SAVE_SUCCESS');
    } catch (error) {
      logEvent('WeeklyPlan', 'SAVE_ERROR', { error: error.message }, 'ERROR');
      console.error("Error saving weekly plan:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreviousWeek = () => {
    setCurrentWeek(prev => subWeeks(prev, 1));
  };

  const handleNextWeek = () => {
    setCurrentWeek(prev => addWeeks(prev, 1));
  };
  
  const handleResetToDefault = () => {
    if (!userProfile) return;
    const defaultCalories = userProfile.daily_calories;
    setWeeklyPlan(prev => ({
      ...prev,
      sunday_calories: defaultCalories,
      monday_calories: defaultCalories,
      tuesday_calories: defaultCalories,
      wednesday_calories: defaultCalories,
      thursday_calories: defaultCalories,
      friday_calories: defaultCalories,
      saturday_calories: defaultCalories,
    }));
    setHasUnsavedChanges(true);
    logEvent('WeeklyPlan', 'RESET_TO_DEFAULT');
  };

  const handleCopyFromPrevious = async () => {
    const previousWeek = subWeeks(currentWeek, 1);
    const previousWeekStr = format(previousWeek, 'yyyy-MM-dd');
    
    try {
              const previousPlans = await weeklyPlanApi.filter({
          created_by: user.email,
          week_start_date: previousWeekStr
        });

      if (previousPlans.length > 0) {
        const prevPlan = previousPlans[0];
        setWeeklyPlan(current => ({
          ...current,
          sunday_calories: prevPlan.sunday_calories,
          monday_calories: prevPlan.monday_calories,
          tuesday_calories: prevPlan.tuesday_calories,
          wednesday_calories: prevPlan.wednesday_calories,
          thursday_calories: prevPlan.thursday_calories,
          friday_calories: prevPlan.friday_calories,
          saturday_calories: prevPlan.saturday_calories,
        }));
        setHasUnsavedChanges(true);
        logEvent('WeeklyPlan', 'COPY_FROM_PREVIOUS_SUCCESS');
      } else {
        alert("לא נמצא תכנון לשבוע הקודם.");
        logEvent('WeeklyPlan', 'COPY_FROM_PREVIOUS_NOT_FOUND');
      }
    } catch (error) {
      console.error("Error copying from previous week:", error);
      logEvent('WeeklyPlan', 'COPY_FROM_PREVIOUS_ERROR', { error: error.message }, 'ERROR');
    }
  };

  const calculateWeeklyAverage = () => {
    if (!weeklyPlan) return 0;
    const total = dayKeys.reduce((sum, day) => sum + (weeklyPlan[`${day}_calories`] || 0), 0);
    return Math.round(total / 7);
  };

  const getAverageStatus = () => {
    if (!userProfile) return null;
    const average = calculateWeeklyAverage();
    const target = userProfile.daily_calories;
    
    if (target === 0) {
        return {
            type: 'good',
            message: 'אין יעד להשוואה',
            color: 'text-slate-500 bg-slate-100'
        };
    }
    
    const deviation = Math.abs(average - target);
    const percentDeviation = (deviation / target) * 100;
    
    if (percentDeviation > 5) {
      return {
        type: 'warning',
        message: `הממוצע חורג ב-${Math.round(percentDeviation)}% מהיעד`,
        color: 'text-red-600 bg-red-50'
      };
    } else if (percentDeviation > 1) {
      return {
        type: 'caution',
        message: `הממוצע חורג ב-${Math.round(percentDeviation)}% מהיעד`,
        color: 'text-yellow-600 bg-yellow-50'
      };
    } else {
      return {
        type: 'good',
        message: 'הממוצע בטווח תקין',
        color: 'text-green-600 bg-green-50'
      };
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-green-500 rounded-2xl flex items-center justify-center animate-pulse">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <p className="text-slate-600">טוען תכנון שבועי...</p>
        </div>
      </div>
    );
  }

  const averageStatus = getAverageStatus();

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen" dir="rtl">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
            תכנון שבועי 📅
          </h1>
          <p className="text-slate-600 text-lg">
            תכנן את יעדי הקלוריות שלך לכל יום בשבוע
          </p>
        </div>

        {/* Week Navigation */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <Button variant="outline" size="icon" onClick={handlePreviousWeek}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <h2 className="text-xl font-semibold text-slate-800 w-80 text-center">
            שבוע {format(currentWeek, 'd/M/yyyy', { locale: he })} - {format(addDays(currentWeek, 6), 'd/M/yyyy', { locale: he })}
          </h2>
          <Button variant="outline" size="icon" onClick={handleNextWeek}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="glass-effect shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Target className="w-4 h-4 text-blue-500" />
                יעד יומי ממוצע
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {userProfile?.daily_calories || 0}
              </div>
              <p className="text-sm text-slate-600">קלוריות ביום</p>
            </CardContent>
          </Card>

          <Card className="glass-effect shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <TrendingUp className="w-4 h-4 text-green-500" />
                ממוצע מתוכנן
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {calculateWeeklyAverage()}
              </div>
              <p className="text-sm text-slate-600">קלוריות ביום</p>
            </CardContent>
          </Card>

          <Card className="glass-effect shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                {averageStatus?.type === 'warning' ? (
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                ) : averageStatus?.type === 'caution' ? (
                  <AlertTriangle className="w-4 h-4 text-yellow-500" />
                ) : (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                )}
                סטטוס תכנון
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge className={`${averageStatus?.color} border-0`}>
                {averageStatus?.message}
              </Badge>
            </CardContent>
          </Card>
        </div>

        {/* Weekly Plan Grid */}
        <Card className="glass-effect shadow-lg mb-8">
          <CardHeader className="flex flex-col md:flex-row items-center justify-between gap-4">
            <CardTitle>תכנון השבוע</CardTitle>
            <div className="flex gap-2 flex-wrap justify-center">
              <Button 
                variant="outline"
                onClick={handleCopyFromPrevious}
              >
                <Copy className="w-4 h-4 mr-2" />
                העתק משבוע קודם
              </Button>
              <Button 
                variant="outline"
                onClick={handleResetToDefault}
              >
                <RefreshCcw className="w-4 h-4 mr-2" />
                אפס לברירת מחדל
              </Button>
              <Button 
                onClick={handleSave} 
                disabled={!hasUnsavedChanges || isSaving}
                className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600"
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'שומר...' : 'שמור תכנון'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {dayKeys.map((dayKey, index) => {
                const dayDate = addDays(currentWeek, index);
                const isCurrentDay = isToday(dayDate);
                
                return (
                  <Card key={dayKey} className={`border-2 ${isCurrentDay ? 'border-blue-400 bg-blue-50' : 'border-slate-200'}`}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-center">
                        <div className="font-bold text-lg">{dayNames[index]}</div>
                        <div className="text-sm text-slate-600 font-normal">
                          {format(dayDate, 'd/M', { locale: he })}
                        </div>
                        {isCurrentDay && (
                          <Badge variant="outline" className="mt-1 bg-blue-100 text-blue-700">
                            היום
                          </Badge>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">קלוריות מתוכננות</label>
                        <Input
                          type="number"
                          value={weeklyPlan?.[`${dayKey}_calories`] || ''}
                          onChange={(e) => handleCalorieChange(dayKey, e.target.value)}
                          className="text-center text-lg font-semibold"
                          placeholder="0"
                        />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {hasUnsavedChanges && (
              <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-center gap-2 text-orange-700">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="font-medium">יש לך שינויים שלא נשמרו</span>
                </div>
                <p className="text-sm text-orange-600 mt-1">
                  לחץ על "שמור תכנון" כדי לשמור את השינויים שלך.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
