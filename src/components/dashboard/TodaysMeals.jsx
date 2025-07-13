import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Utensils, Coffee, Sun, Moon, Clock, MoreVertical, Trash2, Edit, Bot } from "lucide-react";

const mealIcons = {
  breakfast: Coffee,
  lunch: Sun,
  dinner: Moon,
  snack: Clock
};

const mealNames = {
  breakfast: 'ארוחת בוקר',
  lunch: 'ארוחת צהריים',
  dinner: 'ארוחת ערב',
  snack: 'חטיפים'
};

const mealColors = {
  breakfast: 'bg-orange-100 text-orange-800',
  lunch: 'bg-yellow-100 text-yellow-800',
  dinner: 'bg-purple-100 text-purple-800',
  snack: 'bg-green-100 text-green-800'
};

export default function TodaysMeals({ entries, onDelete, onEditQuantity, onEditWithAI }) {
  const groupedEntries = entries.reduce((acc, entry) => {
    const mealType = entry.meal_type;
    if (!acc[mealType]) acc[mealType] = [];
    acc[mealType].push(entry);
    return acc;
  }, {});

  return (
    <Card className="glass-effect shadow-lg smooth-transition hover:shadow-xl">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Utensils className="w-5 h-5 text-blue-500" />
          הארוחות של היום
        </CardTitle>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <div className="text-center py-8">
            <Utensils className="w-12 h-12 mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500">עדיין לא רשמת ארוחות היום</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedEntries).map(([mealType, mealEntries]) => {
              const MealIcon = mealIcons[mealType];
              const totalCalories = mealEntries.reduce((sum, entry) => sum + (entry.calories || 0), 0);
              
              return (
                <div key={mealType} className="border-r-4 border-blue-200 pr-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <MealIcon className="w-4 h-4 text-slate-600" />
                      <h3 className="font-semibold text-slate-900">{mealNames[mealType]}</h3>
                    </div>
                    <Badge className={mealColors[mealType]}>
                      {totalCalories} קלוריות
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    {mealEntries.map((entry) => (
                      <div key={entry.id} className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-slate-900">{entry.food_name}</p>
                          {entry.quantity && entry.unit && (
                            <p className="text-sm text-slate-500">
                              {entry.quantity} {entry.unit}
                            </p>
                          )}
                        </div>
                        <div className="text-left ml-4">
                          <p className="font-semibold text-slate-900">{entry.calories}</p>
                          <p className="text-xs text-slate-500">קלוריות</p>
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <MoreVertical className="w-4 h-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                {entry.entry_method === 'barcode' && (
                                    <DropdownMenuItem onClick={() => onEditQuantity(entry)}>
                                        <Edit className="w-4 h-4 ml-2" />
                                        <span>ערוך כמות</span>
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => onEditWithAI(entry)}>
                                    <Bot className="w-4 h-4 ml-2" />
                                    <span>ערוך עם AI</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => onDelete(entry.id)} className="text-red-600">
                                    <Trash2 className="w-4 h-4 ml-2" />
                                    <span>מחק</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}