import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

const filters = [
  {
    id: 'all',
    label: 'הצג הכול',
    emoji: '🔁',
    condition: () => true
  },
  {
    id: 'high_protein',
    label: 'חלבון גבוה',
    emoji: '🥩',
    condition: (food) => (food.protein || 0) > 20
  },
  {
    id: 'low_calorie',
    label: 'דל קלוריות',
    emoji: '🥦',
    condition: (food) => (food.calories || 0) < 200
  },
  {
    id: 'high_carbs',
    label: 'פחמימות',
    emoji: '🍞',
    condition: (food) => (food.carbs || 0) > 30
  }
];

export default function FilterTabs({ activeFilter, onFilterChange, foods = [] }) {
  const getFilterCount = (filterId) => {
    if (filterId === 'all') return foods.length;
    const filter = filters.find(f => f.id === filterId);
    return foods.filter(filter.condition).length;
  };

  return (
    <div className="mb-6">
      <div className="flex flex-wrap gap-2 justify-center md:justify-start">
        {filters.map((filter) => {
          const isActive = activeFilter === filter.id;
          const count = getFilterCount(filter.id);
          
          return (
            <motion.div
              key={filter.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                variant={isActive ? "default" : "outline"}
                onClick={() => onFilterChange(filter.id)}
                className={`
                  relative transition-all duration-200 gap-2
                  ${isActive 
                    ? 'bg-gradient-to-r from-blue-500 to-green-500 text-white shadow-lg' 
                    : 'hover:bg-blue-50 border-slate-300'
                  }
                `}
              >
                <span className="text-base">{filter.emoji}</span>
                <span className="text-sm font-medium">{filter.label}</span>
                {count > 0 && (
                  <Badge 
                    variant="secondary" 
                    className={`
                      ml-1 text-xs
                      ${isActive 
                        ? 'bg-white/20 text-white' 
                        : 'bg-slate-100 text-slate-600'
                      }
                    `}
                  >
                    {count}
                  </Badge>
                )}
              </Button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}