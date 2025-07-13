
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
  Loader2,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { format, subDays, addDays, isToday, startOfDay } from 'date-fns';
import { he } from 'date-fns/locale';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { createPageUrl } from '@/utils/index';
import { logEvent } from '@/components/utils/logger';
import { getPlannedCaloriesForDate } from '@/components/utils/weeklyPlanUtils';
import { useAuth } from '@/contexts/AuthContext'; // Add this import

export default function TraineeDetailsPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const traineeEmail = searchParams.get('email');

  const [isLoading, setIsLoading] = useState(true);
  const [traineeProfile, setTraineeProfile] = useState(null);
  const [foodEntries, setFoodEntries] = useState([]);
  const [weightData, setWeightData] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [coach, setCoach] = useState(null);
  const [plannedCalories, setPlannedCalories] = useState(0);

  const { isCoach, isAdmin } = useAuth(); // Use AuthContext instead

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

    const loadData = async () => {
      setIsLoading(true);
      try {
        // Check if user is actually a coach OR admin using AuthContext
        const isCoachOrAdmin = isCoach || isAdmin;
        if (!isCoachOrAdmin) {
          console.log('User is not coach or admin, redirecting to dashboard');
          navigate(createPageUrl("Dashboard"));
          return;
        }

        // Get current user data for coach operations
        const currentCoach = await userApi.me();
        setCoach(currentCoach);

        // Get trainee profile
        const traineeProfiles = await userProfileApi.filter({
          created_by: traineeEmail,
          // Removed coach_email filter to allow admin access, authorization check moved below
        });

        // Admin/Coach Authorization Check
        if (traineeProfiles.length === 0 || (!isAdmin && traineeProfiles[0].coach_email !== currentCoach.email)) {
          console.log('User not authorized to view this trainee, redirecting to trainees list');
          navigate(createPageUrl("Trainees"));
          return;
        }

        const profile = traineeProfiles[0];
        setTraineeProfile(profile);

        // Get planned calories for the selected date
        const dayPlannedCalories = await getPlannedCaloriesForDate(traineeEmail, selectedDate);
        setPlannedCalories(dayPlannedCalories);

        // Get food entries for the selected date
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        const entries = await getFoodEntriesByUserAndDate(traineeEmail, dateStr);
        setFoodEntries(entries);

        // Get weight data for the last 30 days
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
        logEvent('TraineeDetailsPage', 'PAGE_LOAD', { traineeEmail, date: dateStr });

      } catch (error) {
        console.error("Error loading trainee details:", error);
        logEvent('TraineeDetailsPage', 'LOAD_ERROR', { error: error.message }, 'ERROR');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [traineeEmail, selectedDate, navigate, isCoach, isAdmin]); // Add isCoach and isAdmin to dependencies

  const handlePreviousDay = () => {
    setSelectedDate(prevDate => subDays(prevDate, 1));
  };

  const handleNextDay = () => {
    if (!isToday(selectedDate)) {
      setSelectedDate(prevDate => addDays(prevDate, 1));
    }
  };

  // Calculate totals from food entries
  const totals = foodEntries.reduce((acc, entry) => ({
    calories: acc.calories + Number(entry.calories || 0),
    protein: acc.protein + Number(entry.protein || 0),
    carbs: acc.carbs + Number(entry.carbs || 0),
    fat: acc.fat + Number(entry.fat || 0)
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

  // Calculate progress using planned calories
  const targetCalories = plannedCalories || traineeProfile?.daily_calories || 2000;
  const progressPercentage = (totals.calories / targetCalories) * 100;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
          <p className="text-slate-600">טוען פרטי מתאמן...</p>
        </div>
      </div>
    );
  }

  if (!traineeProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-slate-600">לא נמצא פרופיל למתאמן זה</p>
          <Button onClick={() => navigate(createPageUrl("Trainees"))} className="mt-4">
            חזור לרשימת המתאמנים
          </Button>
        </div>
      </div>
    );
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
            <ChevronRight className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900">
              {traineeProfile.display_name || traineeEmail}
            </h1>
            <p className="text-slate-600">{traineeEmail}</p>
          </div>
        </div>

        {/* Trainee Info Card */}
        <Card className="glass-effect shadow-lg mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-500" />
              פרטי המתאמן
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-slate-500">גיל:</span>
                <p className="font-semibold">{traineeProfile.age}</p>
              </div>
              <div>
                <span className="text-slate-500">משקל:</span>
                <p className="font-semibold">{traineeProfile.weight} ק"ג</p>
              </div>
              <div>
                <span className="text-slate-500">גובה:</span>
                <p className="font-semibold">{traineeProfile.height} ס"מ</p>
              </div>
              <div>
                <span className="text-slate-500">יעד יומי:</span>
                <p className="font-semibold">{traineeProfile.daily_calories} קלוריות</p>
              </div>
            </div>
          </CardContent>
        </Card>

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

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Daily Progress */}
          <div className="space-y-6">
            {/* Calorie Progress Card */}
            <Card className="glass-effect shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-orange-500" />
                  התקדמות יומית
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-4xl font-bold text-slate-900 mb-2">
                    {Math.round(progressPercentage)}%
                  </div>
                  <div className="text-slate-600">מהיעד היומי</div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">
                      {totals.calories.toLocaleString()} / {targetCalories.toLocaleString()} קלוריות
                    </span>
                    <span className={`font-medium ${progressPercentage <= 90 ? 'text-green-600' :
                        progressPercentage <= 100 ? 'text-orange-600' :
                          'text-red-600'
                      }`}>
                      {Math.round(progressPercentage)}%
                    </span>
                  </div>
                  <Progress
                    value={progressPercentage}
                    className={`h-3 ${progressPercentage <= 90 ? 'bg-green-100' :
                        progressPercentage <= 100 ? 'bg-orange-100' :
                          'bg-red-100'
                      }`}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Macro Distribution Card */}
            <Card className="glass-effect shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-purple-500" />
                  חלוקת מקרו-נוטריינטים
                </CardTitle>
              </CardHeader>
              <CardContent>
                {macroData.length > 0 ? (
                  <div className="space-y-4">
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={macroData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {macroData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value, name, props) => [
                              `${value}% (${props.payload.grams.toFixed(1)}g)`,
                              props.payload.name
                            ]}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {macroData.map((macro, index) => (
                        <div key={index} className="text-center p-3 bg-slate-50 rounded-lg">
                          <div
                            className="w-4 h-4 rounded mx-auto mb-2"
                            style={{ backgroundColor: macro.color }}
                          />
                          <div className="text-sm font-semibold">{macro.name}</div>
                          <div className="text-xs text-slate-600">{macro.grams.toFixed(1)}g</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    אין נתונים לחלוקת מקרו-נוטריינטים
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Food Entries & Weight Progress */}
          <div className="space-y-6">
            {/* Food Entries Card */}
            <Card className="glass-effect shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scale className="w-5 h-5 text-green-500" />
                  ארוחות היום
                </CardTitle>
              </CardHeader>
              <CardContent>
                {foodEntries.length > 0 ? (
                  <div className="space-y-3">
                    {foodEntries.map((entry, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                        <div>
                          <div className="font-medium">{entry.food_name}</div>
                          <div className="text-sm text-slate-600">
                            {mealTypeTranslations[entry.meal_type] || entry.meal_type}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{entry.calories} קלוריות</div>
                          <div className="text-xs text-slate-500">
                            {entry.protein}g חלבון • {entry.carbs}g פחמימות • {entry.fat}g שומן
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    אין ארוחות רשומות ליום זה
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Weight Progress Card */}
            <Card className="glass-effect shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-500" />
                  מעקב משקל (30 יום אחרון)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {weightData.length > 0 ? (
                  <div className="space-y-4">
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={weightData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="displayDate"
                            fontSize={12}
                            tick={{ fontSize: 10 }}
                          />
                          <YAxis
                            domain={['dataMin - 2', 'dataMax + 2']}
                            fontSize={12}
                            tick={{ fontSize: 10 }}
                          />
                          <Tooltip
                            formatter={(value) => [`${value} ק"ג`, 'משקל']}
                            labelFormatter={(label) => `תאריך: ${label}`}
                          />
                          <Line
                            type="monotone"
                            dataKey="weight"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <div className="text-sm text-blue-600">משקל התחלתי</div>
                        <div className="text-xl font-bold">{weightData[0]?.weight?.toFixed(1)} ק"ג</div>
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg">
                        <div className="text-sm text-green-600">משקל נוכחי</div>
                        <div className="text-xl font-bold">{weightData[weightData.length - 1]?.weight?.toFixed(1)} ק"ג</div>
                      </div>
                      <div className="p-3 bg-purple-50 rounded-lg">
                        <div className="text-sm text-purple-600">שינוי כולל</div>
                        <div className={`text-xl font-bold ${(weightData[weightData.length - 1].weight - weightData[0].weight) > 0
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
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    אין נתוני משקל זמינים
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
