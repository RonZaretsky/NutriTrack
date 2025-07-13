import React, { useState, useEffect } from "react";
import { chatMessageApi } from "@/api/chatMessageApi";
import { userApi } from "@/api/userApi";
import { userProfileApi } from "@/api/userProfileApi";
import { getFoodEntriesByUserAndDate } from "@/api/foodEntryApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { BarChart3, Bot, AlertTriangle, Flame, Target, TrendingUp, ChevronLeft, ChevronRight } from "lucide-react";
import { format, addDays, subDays, isToday } from "date-fns";
import { he } from "date-fns/locale";
import { logEvent } from '@/components/utils/logger';
import { getPlannedCaloriesForDate } from '@/components/utils/weeklyPlanUtils';

export default function NutritionalSummaryPage() {
  const [dailyFoods, setDailyFoods] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [plannedCalories, setPlannedCalories] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    logEvent('NutritionalSummaryPage', 'PAGE_LOAD');
    loadSummaryData();
  }, [selectedDate]);

  const loadSummaryData = async () => {
    setIsLoading(true);
    try {
      const user = await userApi.me();
      
      const profiles = await userProfileApi.filter({ created_by: user.email });
      if (profiles.length > 0) {
        setUserProfile(profiles[0]);
      }

      // Get planned calories for the selected date
      const dayPlannedCalories = await getPlannedCaloriesForDate(user.email, selectedDate);
      setPlannedCalories(dayPlannedCalories);

      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      
      const dayFoodEntries = await getFoodEntriesByUserAndDate(user.email, dateStr);
      
      const foodsForGraph = dayFoodEntries.map(entry => ({
        name: entry.food_name,
        calories: Number(entry.calories) || 0,
        protein: Number(entry.protein) || 0,
        carbs: Number(entry.carbs) || 0,
        fat: Number(entry.fat) || 0,
        category: entry.category || 'other'
      }));
      
      setDailyFoods(foodsForGraph);

    } catch (error) {
      logEvent('NutritionalSummaryPage', 'LOAD_ERROR', { error: error.message }, 'ERROR');
      console.error("Error loading summary data:", error);
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

  // Calculate totals from foods
  const totals = dailyFoods.reduce((acc, food) => ({
    calories: acc.calories + Number(food.calories || 0),
    protein: acc.protein + Number(food.protein || 0),
    carbs: acc.carbs + Number(food.carbs || 0),
    fat: acc.fat + Number(food.fat || 0)
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
  const targetCalories = plannedCalories || userProfile?.daily_calories || 2000;
  const progressPercentage = (totals.calories / targetCalories) * 100;
  
  const getProgressColor = () => {
    if (progressPercentage <= 90) return 'bg-green-500';
    if (progressPercentage <= 100) return 'bg-orange-500';
    return 'bg-red-500';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p>טוען סיכום...</p>
      </div>
    );
  }

  if (dailyFoods.length === 0) {
    return (
      <div className="p-6 md:p-8 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2 flex items-center gap-3">
              <BarChart3 className="w-8 h-8" />
              סיכום תזונתי יומי
            </h1>
            <p className="text-slate-600 text-lg">
              כאן תוכל לראות את סיכום כל המאכלים שרשמת.
            </p>
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

          <Card className="glass-effect shadow-lg">
            <CardContent className="p-12 text-center">
              <Bot className="w-16 h-16 mx-auto text-slate-300 mb-4" />
              <h3 className="text-xl font-semibold text-slate-800 mb-2">אין עדיין נתונים ליום זה</h3>
              <p className="text-slate-500">
                לחץ על כפתור הצ'אט הצף כדי להתחיל לתעד את הארוחות שלך.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2 flex items-center gap-3">
            <BarChart3 className="w-8 h-8" />
            סיכום תזונתי יומי
          </h1>
          <p className="text-slate-600 text-lg">
            מצב תזונתי נוכחי וחלוקת המקרו-נוטריינטים שלך.
          </p>
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

        {/* Main cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Calorie Progress Card */}
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
                  {Math.round(progressPercentage)}%
                </div>
                <div className="text-slate-600">מהיעד היומי</div>
                {plannedCalories !== userProfile?.daily_calories && plannedCalories > 0 && (
                  <div className="text-xs text-purple-600 mt-1">יעד מותאם לשבוע</div>
                )}
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">
                    {totals.calories.toLocaleString()} / {targetCalories.toLocaleString()} קלוריות
                  </span>
                  <span className={`font-medium ${
                    progressPercentage <= 90 ? 'text-green-600' :
                    progressPercentage <= 100 ? 'text-orange-600' :
                    'text-red-600'
                  }`}>
                    {progressPercentage <= 90 ? 'בטווח תקין' :
                     progressPercentage <= 100 ? 'קרוב לגבול' :
                     'חריגה מהיעד'}
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-4">
                  <div 
                    className={`h-4 rounded-full transition-all duration-500 ${getProgressColor()}`}
                    style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                  />
                </div>
                <div className="text-center text-sm text-slate-500">
                  {targetCalories - totals.calories > 0 
                    ? `נותרו ${(targetCalories - totals.calories).toLocaleString()} קלוריות` 
                    : `חריגה של ${(totals.calories - targetCalories).toLocaleString()} קלוריות`
                  }
                </div>
              </div>

              {progressPercentage > 100 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start gap-3 text-red-700">
                    <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-medium">חריגה מהיעד</div>
                      <div className="text-sm mt-1">
                        צריכת הקלוריות שלך חרגה מהיעד היומי. שקול להקפיד יותר מחר.
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Macro Distribution Card */}
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
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={macroData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {macroData.map((entry, index) => (
                            <Cell key={`macro-cell-${index}`} fill={entry.color} />
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
                <div className="h-64 flex items-center justify-center text-slate-500">
                  <div className="text-center">
                    <Target className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                    <p>אין נתונים תזונתיים להצגה</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}