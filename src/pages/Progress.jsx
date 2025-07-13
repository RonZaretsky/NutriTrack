
import React, { useState, useEffect } from "react";
import { getFoodEntriesByUserAndDate } from "@/api/foodEntryApi";
import { userProfileApi } from "@/api/userProfileApi";
import { weightEntryApi } from "@/api/weightEntryApi";
import { userApi } from "@/api/userApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  TrendingUp,
  Calendar,
  Target,
  Award,
  BarChart3,
  Flame,
  Activity,
  Scale
} from "lucide-react";
import { format, subDays, startOfDay } from "date-fns";
import { he } from "date-fns/locale";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Progress() {
  const [userProfile, setUserProfile] = useState(null);
  const [weeklyData, setWeeklyData] = useState([]);
  const [weightData, setWeightData] = useState([]);
  const [monthlyStats, setMonthlyStats] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProgressData();
  }, []);

  const loadProgressData = async () => {
    try {
      const user = await userApi.me();

      // Load user profile
      const profiles = await userProfileApi.filter({ created_by: user.email });
      if (profiles.length > 0) {
        setUserProfile(profiles[0]);
      }

      // Load weight entries for the last 30 days
      const today = new Date();
      const thirtyDaysAgo = subDays(today, 30);
      const thirtyDaysAgoStr = format(thirtyDaysAgo, 'yyyy-MM-dd');

      const weightEntries = await weightEntryApi.filter({
        created_by: user.email,
        entry_date: { $gte: thirtyDaysAgoStr }
      });

      const weightChartData = weightEntries.map(entry => ({
        date: entry.entry_date,
        weight: entry.weight,
        displayDate: format(new Date(entry.entry_date), 'd/M', { locale: he })
      }));

      setWeightData(weightChartData);

      // Load entries for the last 7 days
      const weekData = [];

      for (let i = 6; i >= 0; i--) {
        const date = subDays(today, i);
        const dateStr = format(date, 'yyyy-MM-dd');

        const dayEntries = await getFoodEntriesByUserAndDate(user.email, dateStr);

        const normalizedDayEntries = dayEntries.map(entry => ({
          ...entry,
          calories: Number(entry.calories) || 0,
          protein: Number(entry.protein) || 0,
          carbs: Number(entry.carbs) || 0,
          fat: Number(entry.fat) || 0
        }));
        const totalCalories = normalizedDayEntries.reduce((sum, entry) => sum + entry.calories, 0);
        const totalProtein = normalizedDayEntries.reduce((sum, entry) => sum + entry.protein, 0);
        const totalCarbs = normalizedDayEntries.reduce((sum, entry) => sum + entry.carbs, 0);
        const totalFat = normalizedDayEntries.reduce((sum, entry) => sum + entry.fat, 0);

        weekData.push({
          date: dateStr,
          displayDate: format(date, 'EEE', { locale: he }),
          calories: totalCalories,
          protein: totalProtein,
          carbs: totalCarbs,
          fat: totalFat,
          entries: dayEntries.length
        });
      }

      setWeeklyData(weekData);

      // Calculate monthly stats
      const monthStart = format(startOfDay(subDays(today, 30)), 'yyyy-MM-dd');
      const monthEntries = await getFoodEntriesByUserAndDate(user.email, { $gte: monthStart });

      const normalizedMonthEntries = monthEntries.map(entry => ({
        ...entry,
        calories: Number(entry.calories) || 0,
        protein: Number(entry.protein) || 0,
        carbs: Number(entry.carbs) || 0,
        fat: Number(entry.fat) || 0
      }));
      const monthlyCalories = normalizedMonthEntries.reduce((sum, entry) => sum + entry.calories, 0);
      const avgDailyCalories = monthlyCalories / 30;
      const totalEntries = monthEntries.length;
      const daysWithEntries = new Set(monthEntries.map(entry => entry.entry_date)).size;

      setMonthlyStats({
        totalCalories: monthlyCalories,
        avgDailyCalories,
        totalEntries,
        daysWithEntries,
        consistencyPercentage: (daysWithEntries / 30) * 100
      });

    } catch (error) {
      console.error("Error loading progress data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getWeeklyAverage = () => {
    const validDays = weeklyData.filter(day => day.calories > 0);
    if (validDays.length === 0) return 0;
    return validDays.reduce((sum, day) => sum + day.calories, 0) / validDays.length;
  };

  const getGoalText = () => {
    if (!userProfile) return "";
    switch (userProfile.goal) {
      case "lose": return "ירידה במשקל";
      case "gain": return "עלייה במשקל";
      case "maintain": return "שמירה על המשקל";
      default: return "";
    }
  };

  const getConsistencyColor = () => {
    const percentage = monthlyStats.consistencyPercentage || 0;
    if (percentage >= 80) return "text-green-600 bg-green-50";
    if (percentage >= 60) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-green-500 rounded-2xl flex items-center justify-center animate-pulse">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <p className="text-slate-600">טוען נתוני התקדמות...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
            מעקב התקדמות 📊
          </h1>
          <p className="text-slate-600 text-lg">
            עקוב אחר המסע התזונתי שלך ורואה את ההתקדמות
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="glass-effect shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Target className="w-4 h-4 text-blue-500" />
                יעד יומי
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {userProfile?.daily_calories || 0}
              </div>
              <p className="text-sm text-slate-600">קלוריות</p>
              {userProfile && (
                <Badge variant="outline" className="mt-2 text-xs">
                  {getGoalText()}
                </Badge>
              )}
            </CardContent>
          </Card>

          <Card className="glass-effect shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Flame className="w-4 h-4 text-orange-500" />
                ממוצע שבועי
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {Math.round(getWeeklyAverage()).toLocaleString()}
              </div>
              <p className="text-sm text-slate-600">קלוריות ביום</p>
              {userProfile && (
                <div className="mt-2 text-xs text-slate-500">
                  {Math.round((getWeeklyAverage() / userProfile.daily_calories) * 100)}% מהיעד
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="glass-effect shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Activity className="w-4 h-4 text-green-500" />
                עקביות
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {Math.round(monthlyStats.consistencyPercentage || 0)}%
              </div>
              <p className="text-sm text-slate-600">מתוך 30 יום</p>
              <Badge className={`mt-2 text-xs ${getConsistencyColor()}`}>
                {monthlyStats.daysWithEntries || 0} ימים פעילים
              </Badge>
            </CardContent>
          </Card>

          <Card className="glass-effect shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Award className="w-4 h-4 text-purple-500" />
                סך רישומים
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">
                {monthlyStats.totalEntries || 0}
              </div>
              <p className="text-sm text-slate-600">ב-30 יום</p>
              <div className="mt-2 text-xs text-slate-500">
                {Math.round((monthlyStats.totalEntries || 0) / 30 * 10) / 10} ממוצע יומי
              </div>
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

        {/* Weekly Progress */}
        <Card className="glass-effect shadow-lg mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-500" />
              השבוע שעבר
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {weeklyData.map((day, index) => {
                const percentage = userProfile ? (day.calories / userProfile.daily_calories) * 100 : 0;
                const isToday = index === weeklyData.length - 1;

                return (
                  <div key={day.date} className={`p-4 rounded-xl border-2 ${
                    isToday ? 'border-blue-300 bg-blue-50' : 'border-slate-200 bg-white'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="text-sm font-medium text-slate-900">
                          {day.displayDate}
                        </div>
                        <div className="text-xs text-slate-500">
                          {format(new Date(day.date), 'd/M')}
                        </div>
                        {isToday && (
                          <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700">
                            היום
                          </Badge>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-slate-900">
                          {day.calories.toLocaleString()}
                        </div>
                        <div className="text-xs text-slate-500">
                          {day.entries} רישומים
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex-1 bg-slate-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            percentage >= 100 ? 'bg-green-500' :
                            percentage >= 80 ? 'bg-blue-500' :
                            percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                      <div className="text-xs text-slate-600 min-w-0">
                        {Math.round(percentage)}%
                      </div>
                    </div>

                    {day.calories > 0 && (
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="text-center">
                          <div className="font-medium text-blue-600">{Math.round(day.protein)}g</div>
                          <div className="text-slate-500">חלבון</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-green-600">{Math.round(day.carbs)}g</div>
                          <div className="text-slate-500">פחמימות</div>
                        </div>
                        <div className="text-center">
                          <div className="font-medium text-yellow-600">{Math.round(day.fat)}g</div>
                          <div className="text-slate-500">שומן</div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Monthly Summary */}
        <Card className="glass-effect shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              סיכום 30 יום
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">סך קלוריות</span>
                  <span className="font-bold text-2xl text-slate-900">
                    {Math.round(monthlyStats.totalCalories || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">ממוצע יומי</span>
                  <span className="font-bold text-xl text-slate-900">
                    {Math.round(monthlyStats.avgDailyCalories || 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">ימים פעילים</span>
                  <span className="font-bold text-xl text-slate-900">
                    {monthlyStats.daysWithEntries || 0}/30
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-xl">
                  <h4 className="font-semibold text-slate-900 mb-2">הערכה כללית</h4>
                  <div className="space-y-2">
                    {monthlyStats.consistencyPercentage >= 80 && (
                      <Badge className="bg-green-100 text-green-800">
                        עקביות מעולה! 🎉
                      </Badge>
                    )}
                    {monthlyStats.consistencyPercentage >= 60 && monthlyStats.consistencyPercentage < 80 && (
                      <Badge className="bg-yellow-100 text-yellow-800">
                        עקביות טובה, אפשר לשפר 💪
                      </Badge>
                    )}
                    {monthlyStats.consistencyPercentage < 60 && (
                      <Badge className="bg-red-100 text-red-800">
                        דורש שיפור בעקביות 🎯
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
