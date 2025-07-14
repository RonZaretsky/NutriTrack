import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Pencil, Trash2 } from "lucide-react";

export default function TodaysMeals({ entries, onDelete, onEditWithAI, isLoading }) {
  if (isLoading) {
    return (
      <div className="w-full flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500" />
      </div>
    );
  }
  return (
    <div className="flex flex-wrap justify-center gap-6">
      <AnimatePresence>
        {entries.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="w-full text-center py-8"
          >
            <p className="text-gray-500 dark:text-gray-400">עדיין לא רשמת ארוחות היום</p>
          </motion.div>
        ) : (
          entries.map((entry) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-2xl"
            >
              <Card className="backdrop-blur-lg bg-white/70 dark:bg-gray-900/70 border border-gray-200/50 dark:border-gray-700/50 rounded-2xl shadow-lg overflow-hidden flex-shrink-0 min-h-[180px] flex">
                <CardContent className="p-6 flex flex-col-reverse md:flex-row-reverse h-full w-full items-center gap-6 md:gap-8">
                  {/* Action Buttons (side by side on mobile, stacked on desktop) */}
                  <div className="flex flex-row md:flex-col gap-3 w-full md:w-auto justify-center items-center md:ml-6">
                    <Button
                      variant="outline"
                      className="flex items-center gap-2 px-4 h-10"
                      onClick={() => onEditWithAI(entry)}
                    >
                      <Pencil className="w-4 h-4" />
                      ערוך
                    </Button>
                    <Button
                      variant="destructive"
                      className="flex items-center gap-2 px-4 h-10"
                      onClick={() => onDelete(entry.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                      מחק
                    </Button>
                  </div>
                  {/* Main Content (right side) */}
                  <div className="flex-1 flex flex-col justify-between h-full w-full">
                    {/* Title and Time */}
                    <div className="mb-3">
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-1">
                        {entry.food_name}
                      </h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {entry.time || ''}
                      </p>
                    </div>
                    <div className="flex flex-col md:flex-row items-center gap-4 md:gap-10 w-full">
                      {/* Calories */}
                      <div className="flex flex-col items-center justify-center min-w-[90px] mb-2 md:mb-0">
                        <span className="text-xl font-bold text-black dark:text-white">{Number(entry.calories).toFixed(1)}</span>
                        <span className="text-sm text-gray-500 dark:text-gray-400 mt-1">קלוריות</span>
                      </div>
                      {/* Macros */}
                      <div className="flex flex-row gap-6 md:gap-8 flex-1 justify-end">
                        <div className="text-center">
                          <span className="block font-medium text-sm text-purple-700">חלבון</span>
                          <span className="block font-semibold text-base text-black dark:text-white">{Number(entry.protein).toFixed(1)} ג׳</span>
                        </div>
                        <div className="text-center">
                          <span className="block font-medium text-sm text-blue-600">פחמימות</span>
                          <span className="block font-semibold text-base text-black dark:text-white">{Number(entry.carbs).toFixed(1)} ג׳</span>
                        </div>
                        <div className="text-center">
                          <span className="block font-medium text-sm text-yellow-700">שומן</span>
                          <span className="block font-semibold text-base text-black dark:text-white">{Number(entry.fat).toFixed(1)} ג׳</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </AnimatePresence>
    </div>
  );
}