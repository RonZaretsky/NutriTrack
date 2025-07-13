import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { InvokeLLM } from "@/api/integrations";
import { updateFoodEntry } from "@/api/foodEntryApi";
import { X, Send, Loader2, Bot, Save } from "lucide-react";

export default function EditFoodWithAI({ entry, onClose, onSave }) {
  const [editRequest, setEditRequest] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [updatedData, setUpdatedData] = useState(null);
  const [error, setError] = useState(null);

  const handleEditRequest = async () => {
    if (!editRequest.trim()) return;
    
    setIsProcessing(true);
    setError(null);

    try {
      const prompt = `אתה מומחה תזונה מדויק. עליך לערוך רישום מזון לפי בקשת המשתמש ולפי חוקים נוקשים.

**הנתונים הנוכחיים:**
- שם: ${entry.food_name}
- קלוריות: ${entry.calories}
- חלבון: ${entry.protein || 0} גרם
- פחמימות: ${entry.carbs || 0} גרם
- שומן: ${entry.fat || 0} גרם
- כמות: ${entry.quantity || ''} ${entry.unit || ''}

**בקשת המשתמש:** "${editRequest}"

---
**חוקי חישוב קריטיים - עקוב אחריהם במדויק:**
---

**כלל #1: אם המשתמש משנה ערך אחד של חלבון, פחמימות או שומן:**
  א. שנה **רק** את הערך המבוקש.
  ב. שני הערכים האחרים **חייבים להישאר זהים** לערכים המקוריים.
  ג. **חשוב ביותר:** אתה **חייב לחשב מחדש את סך הקלוריות מאפס**. התעלם לחלוטין מסך הקלוריות הישן.
  ד. השתמש בנוסחה המדויקת הזו: \`קלוריות = (חלבון * 4) + (פחמימות * 4) + (שומן * 9)\`.

**דוגמה לכלל #1:**
- משתמש ביקש "שנה חלבון ל-30 גרם".
- נניח שהערכים המקוריים הם: חלבון=27, פחמימות=66, שומן=34.
- החישוב **שלך חייב** להיות:
  - חלבון חדש = 30 גרם
  - פחמימות = 66 גרם (ללא שינוי)
  - שומן = 34 גרם (ללא שינוי)
  - קלוריות חדשות = (30 * 4) + (66 * 4) + (34 * 9) = 120 + 264 + 306 = **690 קלוריות**.

**כלל #2: אם המשתמש משנה את סך הקלוריות:**
  - חשב את היחס: (קלוריות חדשות / קלוריות ישנות).
  - הכפל את **כל** שלושת הערכים (חלבון, פחמימות, שומן) ביחס הזה.

---
עכשיו, בצע את החישוב המדויק לפי החוקים והחזר JSON עם הנתונים המעודכנים.

{
  "food_name": "שם המזון המעודכן",
  "calories": מספר הקלוריות החדש והמחושב,
  "protein": מספר גרם החלבון,
  "carbs": מספר גרם הפחמימות,
  "fat": מספר גרם השומן,
  "quantity": כמות,
  "unit": "יחידת מידה",
  "notes": "הערות מעודכנות",
  "explanation": "הסבר מפורט על השינויים שביצעת ואיך חישבת אותם לפי הנוסחה"
}`;

      const result = await InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            food_name: { type: "string" },
            calories: { type: "number" },
            protein: { type: "number" },
            carbs: { type: "number" },
            fat: { type: "number" },
            quantity: { type: "number" },
            unit: { type: "string" },
            notes: { type: "string" },
            explanation: { type: "string" }
          },
          required: ["food_name", "calories", "explanation"]
        }
      });

      setUpdatedData(result);
    } catch (error) {
      console.error("Error processing edit request:", error);
      setError("אירעה שגיאה בעיבוד הבקשה. נסה שוב.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSave = async () => {
    if (!updatedData) return;

    try {
      await updateFoodEntry(entry.id, {
        ...entry,
        food_name: updatedData.food_name,
        calories: updatedData.calories,
        protein: updatedData.protein || 0,
        carbs: updatedData.carbs || 0,
        fat: updatedData.fat || 0,
        quantity: updatedData.quantity || entry.quantity,
        unit: updatedData.unit || entry.unit,
        notes: updatedData.notes || entry.notes
      });

      onSave();
    } catch (error) {
      console.error("Error saving updated entry:", error);
      setError("אירעה שגיאה בשמירת השינויים.");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEditRequest();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-blue-500" />
            עריכה עם AI: {entry.food_name}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Food Info */}
          <div className="p-4 bg-slate-50 rounded-lg">
            <h3 className="font-semibold text-slate-900 mb-3">פרטי המזון הנוכחיים:</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-600">שם: </span>
                <span className="font-medium">{entry.food_name}</span>
              </div>
              <div>
                <span className="text-slate-600">קלוריות: </span>
                <span className="font-medium">{entry.calories}</span>
              </div>
              <div>
                <span className="text-slate-600">חלבון: </span>
                <span className="font-medium">{entry.protein || 0}g</span>
              </div>
              <div>
                <span className="text-slate-600">פחמימות: </span>
                <span className="font-medium">{entry.carbs || 0}g</span>
              </div>
              <div>
                <span className="text-slate-600">שומן: </span>
                <span className="font-medium">{entry.fat || 0}g</span>
              </div>
              <div>
                <span className="text-slate-600">כמות: </span>
                <span className="font-medium">{entry.quantity || ''} {entry.unit || ''}</span>
              </div>
            </div>
          </div>

          {/* Edit Request */}
          <div>
            <Label htmlFor="editRequest" className="mb-2 block">
              מה תרצה לשנות? (לדוגמה: "תשנה את זה ל800 קלוריות" או "הוסף יותר פרטים")
            </Label>
            <div className="flex gap-2">
              <Input
                id="editRequest"
                placeholder="תשנה את זה ל800 קלוריות..."
                value={editRequest}
                onChange={(e) => setEditRequest(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isProcessing}
                className="flex-1"
              />
              <Button
                onClick={handleEditRequest}
                disabled={isProcessing || !editRequest.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          {/* Quick Examples */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditRequest("תשנה את זה ל800 קלוריות")}
              disabled={isProcessing}
              className="text-right justify-start"
            >
              "תשנה ל800 קלוריות"
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditRequest("תשנה החלבון ל25 גרם")}
              disabled={isProcessing}
              className="text-right justify-start"
            >
              "תשנה החלבון ל25 גרם"
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditRequest("תשנה השומן ל20 גרם")}
              disabled={isProcessing}
              className="text-right justify-start"
            >
              "תשנה השומן ל20 גרם"
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditRequest("הוסף יותר פרטים על המנה")}
              disabled={isProcessing}
              className="text-right justify-start"
            >
              "הוסף פרטים"
            </Button>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
              {error}
            </div>
          )}

          {/* Updated Data Preview */}
          {updatedData && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-semibold text-green-900 mb-3">נתונים מעודכנים:</h3>
              <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                <div>
                  <span className="text-green-700">שם: </span>
                  <span className="font-medium">{updatedData.food_name}</span>
                </div>
                <div>
                  <span className="text-green-700">קלוריות: </span>
                  <span className="font-medium">{updatedData.calories}</span>
                </div>
                <div>
                  <span className="text-green-700">חלבון: </span>
                  <span className="font-medium">{updatedData.protein || 0}g</span>
                </div>
                <div>
                  <span className="text-green-700">פחמימות: </span>
                  <span className="font-medium">{updatedData.carbs || 0}g</span>
                </div>
                <div>
                  <span className="text-green-700">שומן: </span>
                  <span className="font-medium">{updatedData.fat || 0}g</span>
                </div>
                <div>
                  <span className="text-green-700">כמות: </span>
                  <span className="font-medium">{updatedData.quantity || entry.quantity || ''} {updatedData.unit || entry.unit || ''}</span>
                </div>
              </div>
              <div className="p-3 bg-white rounded border border-green-200">
                <p className="text-sm text-green-800">
                  <strong>הסבר השינויים:</strong> {updatedData.explanation}
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={onClose}>
              ביטול
            </Button>
            {updatedData && (
              <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
                <Save className="w-4 h-4 mr-2" />
                שמור שינויים
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}