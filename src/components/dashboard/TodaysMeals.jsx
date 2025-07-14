import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";

export default function TodaysMeals({ entries, onDelete, onEditWithAI }) {
  return (
    <div className="flex flex-wrap justify-center gap-6">
      {entries.length === 0 ? (
        <div className="text-center py-8 w-full">
          <p className="text-slate-500">עדיין לא רשמת ארוחות היום</p>
        </div>
      ) : (
        entries.map((entry) => (
          <Card key={entry.id} className="w-full max-w-xs bg-white rounded-2xl shadow p-0 flex-shrink-0 h-[370px] flex flex-col">
            <CardContent className="p-6 flex flex-col h-full">
              {/* Title and Time (fixed at top, ~20% height) */}
              <div className="mb-2" style={{ minHeight: '20%', flex: '0 0 20%' }}>
                <h2 className="text-2xl font-bold leading-tight mb-1">{entry.food_name}</h2>
                <p className="text-gray-400 text-base mb-2">{entry.time || ''}</p>
              </div>

              {/* Centered Calories and Macros */}
              <div className="flex-1 flex flex-col justify-center">
                <div className="flex flex-col items-center mb-2">
                  <span className="text-4xl font-extrabold text-black leading-none">{entry.calories}</span>
                  <span className="text-lg text-gray-500 mb-1">קלוריות</span>
                </div>
                <div className="flex justify-between text-center mb-2">
                  <div>
                    <span className="block text-purple-700 font-medium text-base">חלבון</span>
                    <span className="block text-black font-bold text-lg">{entry.protein} גרם</span>
                  </div>
                  <div>
                    <span className="block text-blue-600 font-medium text-base">פחמימות</span>
                    <span className="block text-black font-bold text-lg">{entry.carbs} גרם</span>
                  </div>
                  <div>
                    <span className="block text-yellow-700 font-medium text-base">שומן</span>
                    <span className="block text-black font-bold text-lg">{entry.fat} גרם</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons (fixed at bottom) */}
              <div className="flex gap-3 mt-2 pt-2 w-full justify-between">
                <Button variant="default" className="flex-1" onClick={() => onEditWithAI(entry)}>
                  ערוך
                </Button>
                <Button variant="destructive" className="flex-1" onClick={() => onDelete(entry.id)}>
                  מחק
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}