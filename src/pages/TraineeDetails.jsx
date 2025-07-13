
import React, { useState, useEffect } from 'react';
import { userApi } from '@/api/userApi';
import { userProfileApi } from '@/api/userProfileApi';
import { getFoodEntriesByUserAndDate } from '@/api/foodEntryApi';
import { weightEntryApi } from '@/api/weightEntryApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowRight, 
  ChevronLeft, 
  ChevronRight, 
  Scale, 
  Flame, 
  Target,
  BarChart3,
  User as UserIcon,
  Calendar,
  Loader2
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format, subDays, addDays, isToday } from 'date-fns';
import { he } from 'date-fns/locale';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { logEvent } from '@/components/utils/logger';
import { getPlannedCaloriesForDate } from '@/components/utils/weeklyPlanUtils';

export default function TraineeDetailsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const traineeEmail = searchParams.get('email');
  
  const [trainee, setTrainee] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [foodEntries, setFoodEntries] = useState([]);
  const [weightData, setWeightData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [coach, setCoach] = useState(null);
  const [plannedCalories, setPlannedCalories] = useState(0);

  const mealTypeTranslations = {
    breakfast: "ארוחת בוקר",
    lunch: "ארוחת צהריים", 
    dinner: "ארוחת ערב",
    snack: "חטיף / נשנוש"
  };

  useEffect(() => {
    if (!traineeEmail) {
      navigate(createPageUrl("Trainees"));
      return;
    }
    loadTraineeData();
  }, [traineeEmail, selectedDate]);

  const loadTraineeData = async () => {
    setIsLoading(true);
    try {
      const currentCoach = await userApi.me();
      const isCoachOrAdmin = currentCoach.is_coach || currentCoach.role === 'admin';
      if (!isCoachOrAdmin) {
        navigate(createPageUrl("Dashboard"));
        return;
      }
      setCoach(currentCoach);

      // Get trainee profile
      const traineeProfiles = await userProfileApi.filter({ 
        created_by: traineeEmail,
        // Removed coach_email filter to allow admin access, authorization check moved below
      });
      
      // Admin/Coach Authorization Check
      if (traineeProfiles.length === 0 || (currentCoach.role !== 'admin' && traineeProfiles[0].coach_email !== currentCoach.email)) {
        navigate(createPageUrl("Trainees"));
        return;
      }

      const profile = traineeProfiles[0];
      
      // Get trainee's name
      let fullName = profile.display_name;
      if (!fullName) {
        try {
          const userInfo = await userApi.filter({ email: traineeEmail });
          if (userInfo.length > 0 && userInfo[0].full_name) {
            fullName = userInfo[0].full_name;
          }
        } catch (error) {
          console.warn(`Failed to fetch full name for ${traineeEmail}:`, error);
        }
      }
      if (!fullName) {
        fullName = traineeEmail.split('@')[0];
      }

      setTrainee({ ...profile, fullName });

      // Get dynamic planned calories
      const dailyPlannedCalories = await getPlannedCaloriesForDate(traineeEmail, selectedDate);
      setPlannedCalories(dailyPlannedCalories);

      // Get food entries for selected date
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const todayFoodEntries = await getFoodEntriesByUserAndDate(traineeEmail, dateStr);
      setFoodEntries(todayFoodEntries);

      // Get weight data for last 30 days
      const thirtyDaysAgo = subDays(new Date(), 30);
      const thirtyDaysAgoStr = format(thirtyDaysAgo, 'yyyy-MM-dd');
      
      const weightEntries = await weightEntryApi.filter({
        created_by: traineeEmail,
        entry_date: { $gte: thirtyDaysAgoStr }
      });

      const weightChartData = weightEntries.map(entry => ({
        date: entry.entry_date,
        weight: entry.weight,
        displayDate: format(new Date(entry.entry_date), 'd/M', { locale: he })
      }));
      
      setWeightData(weightChartData);

    } catch (error) {
      console.error("Error loading trainee data:", error);
      navigate(createPageUrl("Trainees"));
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreviousDay = () => {
    setSelectedDate(prevDate => subDays(prevDate, 1));
  };

  const handleNextDay = () => {
    if (!isToday(selectedDate)) {
      setSelectedDate(prevDate => addDays(prevDate, 1));
    }
  };

  // Calculate totals
  const totals = foodEntries.reduce((acc, entry) => ({
    calories: acc.calories + (entry.calories || 0),
    protein: acc.protein + (entry.protein || 0),
    carbs: acc.carbs + (entry.carbs || 0),
    fat: acc.fat + (entry.fat || 0)
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

  // Calculate macro data for pie chart
  const proteinCalories = totals.protein * 4;
  const carbCalories = totals.carbs * 4;
  const fatCalories = totals.fat * 9;
  const totalMacroCalories = proteinCalories + carbCalories + fatCalories;

  const macroData = totalMacroCalories > 0 ? [
    { 
      name: 'חלבון', 
      value: Math.round((proteinCalories / totalMacroCalories) * 100),
      grams: totals.protein,
      color: '#3b82f6'
    },
    { 
      name: 'פחמימות', 
      value: Math.round((carbCalories / totalMacroCalories) * 100),
      grams: totals.carbs,
      color: '#f97316'
    },
    { 
      name: 'שומן', 
      value: Math.round((fatCalories / totalMacroCalories) * 100),
      grams: totals.fat,
      color: '#ef4444'
    }
  ] : [];

  const targetCalories = plannedCalories > 0 ? plannedCalories : trainee?.daily_calories || 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
          <p className="text-slate-600">טוען נתוני מתאמן...</p>
        </div>
      </div>
    );
  }

  if (!trainee) {
    return null;
  }

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen" dir="rtl">
      <div className="max-w-6xl mx-auto">
        {/* Header with back button */}
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => navigate(createPageUrl("Trainees"))}
          >
            <ArrowRight className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{trainee.fullName}</h1>
            <p className="text-slate-600">{traineeEmail}</p>
          </div>
        </div>

        {/* Date Navigation */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <Button variant="outline" size="icon" onClick={handlePreviousDay}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <h2 className="text-xl font-semibold text-slate-800 w-64 text-center">
            {isToday(selectedDate) ? "היום" : format(selectedDate, 'EEEE, d MMMM', { locale: he })}
          </h2>
          <Button variant="outline" size="icon" onClick={handleNextDay} disabled={isToday(selectedDate)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="glass-effect shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <UserIcon className="w-4 h-4 text-blue-500" />
                גיל
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{trainee.age}</div>
            </CardContent>
          </Card>

          <Card className="glass-effect shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Scale className="w-4 h-4 text-green-500" />
                משקל
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{trainee.weight}</div>
              <p className="text-sm text-slate-600">ק"ג</p>
            </CardContent>
          </Card>

          <Card className="glass-effect shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Target className="w-4 h-4 text-purple-500" />
                יעד יומי
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{targetCalories}</div>
              <p className="text-sm text-slate-600">קלוריות</p>
            </CardContent>
          </Card>

          <Card className="glass-effect shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Flame className="w-4 h-4 text-orange-500" />
                צריכה היום
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{totals.calories}</div>
              <p className="text-sm text-slate-600">קלוריות</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Calorie Progress */}
          <Card className="glass-effect shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-500" />
                התקדמות יומית
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="text-5xl font-bold text-slate-900 mb-2">
                  {targetCalories > 0 ? Math.round((totals.calories / targetCalories) * 100) : 0}%
                </div>
                <div className="text-slate-600">מהיעד היומי</div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">
                    {totals.calories.toLocaleString()} / {targetCalories.toLocaleString()} קלוריות
                  </span>
                </div>
                <Progress value={targetCalories > 0 ? (totals.calories / targetCalories) * 100 : 0} />
              </div>
            </CardContent>
          </Card>

          {/* Macro Distribution */}
          <Card className="glass-effect shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-500" />
                חלוקת מקרו-נוטריינטים
              </CardTitle>
            </CardHeader>
            <CardContent>
              {totalMacroCalories > 0 ? (
                <div className="space-y-6">
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={macroData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {macroData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value, name, props) => [
                            `${value}% (${props.payload.grams.toFixed(1)}g)`,
                            name
                          ]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    {macroData.map((macro, index) => (
                      <div key={index} className="text-center p-3 bg-slate-50 rounded-lg">
                        <div 
                          className="w-4 h-4 rounded mx-auto mb-2"
                          style={{ backgroundColor: macro.color }}
                        />
                        <div className="font-semibold text-slate-900">{macro.name}</div>
                        <div className="text-sm text-slate-600">{macro.value}%</div>
                        <div className="text-xs text-slate-500">{macro.grams.toFixed(1)}g</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center text-slate-500">
                  <div className="text-center">
                    <Target className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                    <p>אין נתונים תזונתיים להצגה</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Weight Progress Chart */}
        {weightData.length > 0 && (
          <Card className="glass-effect shadow-lg mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-blue-500" />
                מעקב משקל - 30 יום אחרונים
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weightData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="displayDate"
                      tick={{ fontSize: 12 }}
                      stroke="#64748b"
                    />
                    <YAxis
                      domain={['dataMin - 1', 'dataMax + 1']}
                      tick={{ fontSize: 12 }}
                      stroke="#64748b"
                    />
                    <Tooltip
                      formatter={(value) => [`${value} ק"ג`, 'משקל']}
                      labelFormatter={(label) => `תאריך: ${label}`}
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="weight"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, fill: '#3b82f6' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {weightData.length >= 2 && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="text-sm text-blue-600">משקל נוכחי</div>
                    <div className="text-xl font-bold text-blue-800">
                      {weightData[weightData.length - 1].weight} ק"ג
                    </div>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="text-sm text-green-600">משקל התחלתי</div>
                    <div className="text-xl font-bold text-green-800">
                      {weightData[0].weight} ק"ג
                    </div>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <div className="text-sm text-purple-600">שינוי כולל</div>
                    <div className={`text-xl font-bold ${
                      (weightData[weightData.length - 1].weight - weightData[0].weight) > 0
                        ? 'text-red-600'
                        : (weightData[weightData.length - 1].weight - weightData[0].weight) < 0
                        ? 'text-green-600'
                        : 'text-gray-600'
                    }`}>
                      {(weightData[weightData.length - 1].weight - weightData[0].weight) > 0 ? '+' : ''}
                      {(weightData[weightData.length - 1].weight - weightData[0].weight).toFixed(1)} ק"ג
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Food Entries */}
        <Card className="glass-effect shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-green-500" />
              ארוחות היום ({format(selectedDate, 'd/M/yyyy')})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {foodEntries.length === 0 ? (
              <p className="text-center text-slate-500 py-8">
                לא נרשמו ארוחות ביום זה
              </p>
            ) : (
              <div className="space-y-3">
                {foodEntries.map((entry) => (
                  <div key={entry.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{entry.food_name}</p>
                      <div className="flex items-center gap-4 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {mealTypeTranslations[entry.meal_type] || entry.meal_type}
                        </Badge>
                        {entry.quantity && entry.unit && (
                          <p className="text-xs text-slate-500">
                            {entry.quantity} {entry.unit}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">{entry.calories} קלוריות</p>
                      <div className="text-xs text-slate-500 space-x-2">
                        <span>חלבון: {entry.protein || 0}g</span>
                        <span>פחמימות: {entry.carbs || 0}g</span>
                        <span>שומן: {entry.fat || 0}g</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
