import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Flame, Target, TrendingUp, TrendingDown } from "lucide-react";

export default function CalorieCard({ totalCalories, targetCalories, goal }) {
  const percentage = targetCalories > 0 ? (totalCalories / targetCalories) * 100 : 0;
  const remaining = Math.max(0, targetCalories - totalCalories);

  const getStatusColor = () => {
    if (percentage < 80) return 'text-blue-500';
    if (percentage < 100) return 'text-green-500';
    if (percentage < 120) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getStatusText = () => {
    if (percentage < 80) return 'עוד יש מקום';
    if (percentage < 100) return 'כמעט שם!';
    if (percentage < 120) return 'מצוין!';
    return 'חרגת מהיעד';
  };

  const getGoalIcon = () => {
    switch (goal) {
      case 'lose': return <TrendingDown className="w-5 h-5 text-red-500" />;
      case 'gain': return <TrendingUp className="w-5 h-5 text-green-500" />;
      default: return <Target className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <Card className="glass-effect shadow-lg smooth-transition hover:shadow-xl overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" />
            <span className="text-lg">קלוריות היום</span>
          </div>
          <Badge variant="outline" className="bg-slate-50">
            {getGoalIcon()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <div className="text-4xl font-bold text-slate-900 mb-1">
            {Number(totalCalories).toLocaleString(undefined, { maximumFractionDigits: 1 })}
          </div>
          <div className="text-sm text-slate-600">
            מתוך {Number(targetCalories).toLocaleString(undefined, { maximumFractionDigits: 1 })} קלוריות
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">התקדמות</span>
            <span className={`font-medium ${getStatusColor()}`}>
              {Math.round(percentage)}% • {getStatusText()}
            </span>
          </div>
          <Progress
            value={Math.min(percentage, 100)}
            className="h-3 bg-slate-200"
          />
        </div>

        <div className="flex justify-between items-center text-sm">
          <div className="text-center">
            <div className="font-semibold text-slate-900">
              {Number(remaining).toLocaleString(undefined, { maximumFractionDigits: 1 })}
            </div>
            <div className="text-slate-500">נותרו</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-slate-900">
              {Number(Math.max(0, totalCalories - targetCalories)).toLocaleString(undefined, { maximumFractionDigits: 1 })}
            </div>
            <div className="text-slate-500">עודף</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}