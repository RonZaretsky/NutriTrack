import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Activity, Zap, Shield } from "lucide-react";

export default function NutritionBreakdown({ nutrients, targetCalories }) {
  const proteinTarget = Math.round(targetCalories * 0.25 / 4);
  const carbsTarget = Math.round(targetCalories * 0.45 / 4);
  const fatTarget = Math.round(targetCalories * 0.30 / 9);

  const macros = [
    {
      name: 'חלבון',
      value: Number(nutrients.protein || 0).toFixed(1),
      target: proteinTarget,
      unit: 'גרם',
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
      icon: Shield,
      description: 'לבניית שרירים'
    },
    {
      name: 'פחמימות',
      value: Number(nutrients.carbs || 0).toFixed(1),
      target: carbsTarget,
      unit: 'גרם',
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
      icon: Zap,
      description: 'לאנרגיה'
    },
    {
      name: 'שומן',
      value: Number(nutrients.fat || 0).toFixed(1),
      target: fatTarget,
      unit: 'גרם',
      color: 'bg-yellow-500',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-700',
      icon: Activity,
      description: 'לתפקוד הורמונלי'
    }
  ];

  return (
    <Card className="glass-effect shadow-lg smooth-transition hover:shadow-xl">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Activity className="w-5 h-5 text-blue-500" />
          פירוט תזונתי
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {macros.map((macro) => {
            const percentage = macro.target > 0 ? (macro.value / macro.target) * 100 : 0;
            const MacroIcon = macro.icon;

            return (
              <div key={macro.name} className={`p-4 rounded-xl ${macro.bgColor}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${macro.color} flex items-center justify-center`}>
                      <MacroIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{macro.name}</h3>
                      <p className="text-sm text-slate-600">{macro.description}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className={`${macro.bgColor} ${macro.textColor} border-0`}>
                    {Math.round(percentage)}%
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">
                      {macro.value} / {macro.target} {macro.unit}
                    </span>
                    <span className={`font-medium ${macro.textColor}`}>
                      נותרו: {Math.max(0, macro.target - macro.value)} {macro.unit}
                    </span>
                  </div>
                  <Progress
                    value={Math.min(percentage, 100)}
                    className="h-2 bg-slate-200"
                  />
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 p-4 bg-slate-50 rounded-xl">
          <h4 className="font-semibold text-slate-900 mb-2">הצרכים התזונתיים שלך</h4>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <p className="text-slate-600">חלבון</p>
              <p className="font-semibold text-blue-600">25%</p>
            </div>
            <div className="text-center">
              <p className="text-slate-600">פחמימות</p>
              <p className="font-semibold text-green-600">45%</p>
            </div>
            <div className="text-center">
              <p className="text-slate-600">שומן</p>
              <p className="font-semibold text-yellow-600">30%</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}