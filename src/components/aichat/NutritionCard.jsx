import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Drumstick, Wheat, Droplets, Carrot, Apple, Milk, Package, Flame, Target } from "lucide-react";

const categoryInfo = {
  protein: { icon: Drumstick, color: 'border-sky-300 bg-sky-50/50' },
  carbohydrate: { icon: Wheat, color: 'border-amber-300 bg-amber-50/50' },
  fat: { icon: Droplets, color: 'border-yellow-300 bg-yellow-50/50' },
  vegetable: { icon: Carrot, color: 'border-emerald-300 bg-emerald-50/50' },
  fruit: { icon: Apple, color: 'border-rose-300 bg-rose-50/50' },
  dairy: { icon: Milk, color: 'border-slate-300 bg-slate-50/50' },
  other: { icon: Package, color: 'border-gray-300 bg-gray-50/50' },
  summary: { icon: Target, color: 'border-gradient bg-gradient-to-r from-blue-500 to-green-500' }, // Special for summary
};

export default function NutritionCard({ food }) {
  const { name, calories, protein, carbs, fat, category } = food;
  const info = categoryInfo[category?.toLowerCase()] || categoryInfo.other;
  const Icon = info.icon;
  
  // Special styling for summary card
  const isSummary = category?.toLowerCase() === 'summary';

  if (isSummary) {
    return (
      <Card className="w-full max-w-sm rounded-2xl shadow-lg border-2 bg-gradient-to-r from-blue-500 to-green-500 text-white">
        <CardContent className="p-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg text-white">{name}</h3>
              <p className="text-sm text-white/90 flex items-center gap-1">
                <Flame className="w-4 h-4" />
                {calories} קלוריות
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-sm text-white/80">חלבון</p>
              <p className="font-semibold text-white">{protein || 0}g</p>
            </div>
            <div>
              <p className="text-sm text-white/80">פחמימות</p>
              <p className="font-semibold text-white">{carbs || 0}g</p>
            </div>
            <div>
              <p className="text-sm text-white/80">שומן</p>
              <p className="font-semibold text-white">{fat || 0}g</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Regular ingredient card (gray styling)
  return (
    <Card className="w-full max-w-sm rounded-2xl shadow-md border-2 border-gray-300 bg-gray-50/50">
      <CardContent className="p-4">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gray-200 flex items-center justify-center">
            <Icon className="w-6 h-6 text-gray-600" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg text-gray-800">{name}</h3>
            <p className="text-sm text-gray-600 flex items-center gap-1">
                <Flame className="w-4 h-4 text-orange-500" />
                {calories} קלוריות
            </p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-sm text-gray-500">חלבון</p>
            <p className="font-semibold text-gray-700">{protein || 0}g</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">פחמימות</p>
            <p className="font-semibold text-gray-700">{carbs || 0}g</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">שומן</p>
            <p className="font-semibold text-gray-700">{fat || 0}g</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}