import React, { useState, useEffect } from 'react';
import { userApi } from "@/api/userApi";
import { createFoodEntry, updateFoodEntry } from "@/api/foodEntryApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Plus, Save } from "lucide-react";
import { format } from "date-fns";

export default function FoodFormModal({ onClose, onSave, entryToEdit, initialScanData }) {
  const [formData, setFormData] = useState({
    food_name: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
    quantity: '',
    unit: '',
    meal_type: 'snack',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditMode = !!entryToEdit;
  const isBarcodeEdit = isEditMode && entryToEdit.entry_method === 'barcode';

  useEffect(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    if (isEditMode) {
      setFormData({
        ...entryToEdit,
        calories: entryToEdit.calories?.toString() || '',
        protein: entryToEdit.protein?.toString() || '',
        carbs: entryToEdit.carbs?.toString() || '',
        fat: entryToEdit.fat?.toString() || '',
        quantity: entryToEdit.quantity?.toString() || '',
        entry_date: entryToEdit.entry_date || today
      });
    } else if (initialScanData) {
      setFormData({
        food_name: initialScanData.food_name || '',
        calories: initialScanData.calories?.toString() || '',
        protein: initialScanData.protein?.toString() || '',
        carbs: initialScanData.carbs?.toString() || '',
        fat: initialScanData.fat?.toString() || '',
        quantity: initialScanData.quantity?.toString() || '100',
        unit: initialScanData.unit || 'גרם',
        meal_type: 'snack',
        notes: 'נסרק באמצעות ברקוד.',
        entry_method: 'barcode',
        entry_date: today
      });
    } else {
        setFormData({
            food_name: '',
            calories: '',
            protein: '',
            carbs: '',
            fat: '',
            quantity: '',
            unit: '',
            meal_type: 'snack',
            notes: '',
            entry_method: 'manual',
            entry_date: today
        });
    }
  }, [entryToEdit, initialScanData, isEditMode]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const user = await userApi.me();
      const dataToSave = {
        ...formData,
        calories: parseFloat(formData.calories) || 0,
        protein: parseFloat(formData.protein) || 0,
        carbs: parseFloat(formData.carbs) || 0,
        fat: parseFloat(formData.fat) || 0,
        quantity: parseFloat(formData.quantity) || 0,
        created_by: user.email
      };

      if (isEditMode) {
        await updateFoodEntry(entryToEdit.id, dataToSave);
      } else {
        await createFoodEntry(dataToSave);
      }

      onSave();
    } catch (error) {
      console.error("Error saving food entry:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{isEditMode ? 'עריכת פריט' : 'הוספת מזון'}</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="food_name">שם המזון</Label>
                <Input
                  id="food_name"
                  placeholder="לדוגמה: תפוח, לחם, עוף"
                  value={formData.food_name}
                  onChange={(e) => handleInputChange('food_name', e.target.value)}
                  required
                  disabled={isBarcodeEdit}
                />
              </div>
              <div>
                <Label htmlFor="meal_type">סוג ארוחה</Label>
                <Select value={formData.meal_type} onValueChange={(value) => handleInputChange('meal_type', value)} disabled={isBarcodeEdit}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="breakfast">ארוחת בוקר</SelectItem>
                    <SelectItem value="lunch">ארוחת צהריים</SelectItem>
                    <SelectItem value="dinner">ארוחת ערב</SelectItem>
                    <SelectItem value="snack">חטיף</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quantity">כמות</Label>
                <Input
                  id="quantity"
                  type="number"
                  step="0.1"
                  placeholder="1"
                  value={formData.quantity}
                  onChange={(e) => handleInputChange('quantity', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="unit">יחידת מידה</Label>
                <Input
                  id="unit"
                  placeholder="יחידות, גרם, כוס"
                  value={formData.unit}
                  onChange={(e) => handleInputChange('unit', e.target.value)}
                  disabled={isBarcodeEdit}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="calories">קלוריות</Label>
                <Input
                  id="calories"
                  type="number"
                  placeholder="100"
                  value={formData.calories}
                  onChange={(e) => handleInputChange('calories', e.target.value)}
                  required
                  disabled={isBarcodeEdit}
                />
              </div>
              <div>
                <Label htmlFor="protein">חלבון (גרם)</Label>
                <Input
                  id="protein"
                  type="number"
                  step="0.1"
                  placeholder="10"
                  value={formData.protein}
                  onChange={(e) => handleInputChange('protein', e.target.value)}
                  disabled={isBarcodeEdit}
                />
              </div>
              <div>
                <Label htmlFor="carbs">פחמימות (גרם)</Label>
                <Input
                  id="carbs"
                  type="number"
                  step="0.1"
                  placeholder="20"
                  value={formData.carbs}
                  onChange={(e) => handleInputChange('carbs', e.target.value)}
                  disabled={isBarcodeEdit}
                />
              </div>
              <div>
                <Label htmlFor="fat">שומן (גרם)</Label>
                <Input
                  id="fat"
                  type="number"
                  step="0.1"
                  placeholder="5"
                  value={formData.fat}
                  onChange={(e) => handleInputChange('fat', e.target.value)}
                  disabled={isBarcodeEdit}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="notes">הערות (אופציונלי)</Label>
              <Input
                id="notes"
                placeholder="הערות נוספות על המזון"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                disabled={isBarcodeEdit}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                ביטול
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600"
              >
                {isSubmitting ? 'שומר...' : (isEditMode ? 'שמור שינויים' : 'הוסף מזון')}
                {isEditMode ? <Save className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}