import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Flame, Target, TrendingUp, AlertTriangle } from "lucide-react";

export default function SummaryGraph({ foods = [], dailyCalorieTarget = 2000 }) {
  // Calculate totals
  const totals = foods.reduce((acc, food) => ({
    calories: acc.calories + (food.calories || 0),
    protein: acc.protein + (food.protein || 0),
    carbs: acc.carbs + (food.carbs || 0),
    fat: acc.fat + (food.fat || 0)
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

  // Calculate macro percentages (calories from each macro)
  const proteinCalories = totals.protein * 4;
  const carbCalories = totals.carbs * 4;
  const fatCalories = totals.fat * 9;
  const totalMacroCalories = proteinCalories + carbCalories + fatCalories;

  const macroData = totalMacroCalories > 0 ? [
    { 
      name: 'חלבון', 
      value: Math.round((proteinCalories / totalMacroCalories) * 100),
      calories: proteinCalories,
      grams: totals.protein
    },
    { 
      name: 'פחמימות', 
      value: Math.round((carbCalories / totalMacroCalories) * 100),
      calories: carbCalories,
      grams: totals.carbs
    },
    { 
      name: 'שומן', 
      value: Math.round((fatCalories / totalMacroCalories) * 100),
      calories: fatCalories,
      grams: totals.fat
    }
  ] : [];

  const COLORS = {
    'חלבון': '#3b82f6',
    'פחמימות': '#f97316', 
    'שומן': '#ef4444'
  };

  // Calculate progress percentage
  const progressPercentage = (totals.calories / dailyCalorieTarget) * 100;
  
  // Determine progress color
  const getProgressColor = () => {
    if (progressPercentage <= 90) return 'bg-green-500';
    if (progressPercentage <= 100) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getProgressMessage = () => {
    if (progressPercentage <= 90) return 'בטווח תקין';
    if (progressPercentage <= 100) return 'קרוב לגבול';
    return 'חריגה מהיעד';
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-200">
          <p className="font-semibold text-slate-900">{data.name}</p>
          <p className="text-sm text-slate-600">{data.value}% ({data.grams}g)</p>
          <p className="text-xs text-slate-500">{Math.round(data.calories)} קלוריות</p>
        </div>
      );
    }
    return null;
  };

  if (foods.length === 0) {
    return null;
  }

  return (
    <Card className="glass-effect shadow-lg mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="w-5 h-5 text-blue-500" />
          סיכום תזונתי
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Calorie Progress */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-500" />
                התקדמות קלורית
              </h3>
              <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                progressPercentage <= 90 ? 'bg-green-100 text-green-700' :
                progressPercentage <= 100 ? 'bg-orange-100 text-orange-700' :
                'bg-red-100 text-red-700'
              }`}>
                {getProgressMessage()}
              </span>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">
                  {totals.calories} / {dailyCalorieTarget} קלוריות
                </span>
                <span className="font-medium text-slate-900">
                  {Math.round(progressPercentage)}%
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full transition-all duration-500 ${getProgressColor()}`}
                  style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                />
              </div>
              <div className="text-xs text-slate-500">
                {dailyCalorieTarget - totals.calories > 0 
                  ? `נותרו ${dailyCalorieTarget - totals.calories} קלוריות` 
                  : `חריגה של ${totals.calories - dailyCalorieTarget} קלוריות`
                }
              </div>
            </div>

            {progressPercentage > 100 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="font-medium text-sm">
                    ⚠️ צריכת הקלוריות שלך חרגה מהיעד היומי!
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Macro Distribution */}
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-900 flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-500" />
              התפלגות מקרו-נוטריינטים
            </h3>
            
            {totalMacroCalories > 0 ? (
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={macroData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {macroData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[entry.name]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend 
                      formatter={(value, entry) => (
                        <span style={{ color: entry.color }}>
                          {value} ({entry.payload.value}%)
                        </span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-slate-500">
                <p>אין נתונים תזונתיים להצגה</p>
              </div>
            )}

            {/* Macro breakdown */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 bg-blue-50 rounded">
                <div className="font-bold text-blue-700">{totals.protein}g</div>
                <div className="text-blue-600">חלבון</div>
              </div>
              <div className="p-2 bg-orange-50 rounded">
                <div className="font-bold text-orange-700">{totals.carbs}g</div>
                <div className="text-orange-600">פחמימות</div>
              </div>
              <div className="p-2 bg-red-50 rounded">
                <div className="font-bold text-red-700">{totals.fat}g</div>
                <div className="text-red-600">שומן</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}