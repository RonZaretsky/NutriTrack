

import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Menu,
  Home,
  User as UserIcon,
  TrendingUp,
  Apple,
  Users,
  LogOut,
  Shield,
  BarChart3,
  X,
  HeartHandshake,
  Calendar,
  Bot
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import DemoModeToggle from "@/components/common/DemoModeToggle";
import FloatingChatPanel from "@/components/nutritionalSummary/FloatingChatPanel";
import { chatMessageApi } from "@/api/chatMessageApi";
import { createFoodEntry } from "@/api/foodEntryApi";
import { InvokeLLM, UploadFile } from "@/api/integrations";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { AnimatePresence } from "framer-motion";

const navigationItems = [
  {
    title: "דשבורד",
    url: createPageUrl("Dashboard"),
    icon: Home,
  },
  {
    title: "תכנון שבועי",
    url: createPageUrl("WeeklyPlan"),
    icon: Calendar,
  },
  {
    title: "סיכום תזונתי",
    url: createPageUrl("NutritionalSummary"),
    icon: BarChart3,
  },
  {
    title: "הפרופיל שלי",
    url: createPageUrl("Profile"),
    icon: UserIcon,
  },
  {
    title: "התקדמות",
    url: createPageUrl("Progress"),
    icon: TrendingUp,
  },
  {
    title: "חברים",
    url: createPageUrl("Friends"),
    icon: Users,
  },
];

const coachNavItems = [
  {
    title: "המתאמנים שלי",
    url: createPageUrl("Trainees"),
    icon: HeartHandshake,
  }
];

const adminNavItems = [
  {
    title: "ניהול משתמשים",
    url: createPageUrl("AdminUsers"),
    icon: Shield,
  },
  {
    title: "יומן מערכת",
    url: createPageUrl("AdminLogs"),
    icon: Shield,
  }
];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const { user, isAdmin, isCoach, signOut } = useAuth();

  // Chat State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);

  const getFilteredFoods = (foods) => {
    return foods || [];
  };

  useEffect(() => {
    const loadUserChat = async () => {
      if (user) {
        loadMessages(user);
      }
    };
    loadUserChat();

    const handleOpenChat = (event) => {
      setIsChatOpen(true);
      if (event.detail && event.detail.message) {
        setMessages(prev => [...prev, event.detail.message]);
      }
    };

    window.addEventListener('openChatWithMessage', handleOpenChat);

    return () => {
      window.removeEventListener('openChatWithMessage', handleOpenChat);
    };
  }, [user]);

  const loadMessages = async (currentUser) => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const todayMessages = await chatMessageApi.filter({
        created_by: currentUser.email,
        chat_date: today
      }, 'created_date');
      setMessages(todayMessages);
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setIsLoading(true);
    try {
      const { file_url } = await UploadFile({ file });
      setUploadedImage(file_url);
    } catch (error) {
      console.error("Error uploading file:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() && !uploadedImage) return;
    const userMessage = newMessage.trim();
    const imageUrl = uploadedImage;
    setNewMessage("");
    setUploadedImage(null);
    setIsLoading(true);

    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const userChatMessage = await chatMessageApi.create({
        message: userMessage,
        sender: "user",
        chat_date: today,
        image_url: imageUrl,
        created_by: user.email
      });
      setMessages(prev => [...prev, userChatMessage]);

      // Check if we have a pending chat state
      const { chatStateApi } = await import('@/api/chatStateApi');
      const pendingStates = await chatStateApi.filter({
        user_email: user.email,
        expires_at: { $gt: new Date().toISOString() }
      });

      if (pendingStates.length > 0 && pendingStates[0].state_type === 'waiting_for_quantity') {
        const state = pendingStates[0];
        const quantity = parseFloat(userMessage);

        if (!isNaN(quantity) && quantity > 0) {
          const foodData = JSON.parse(state.food_data);

          const factor = quantity / 100;
          const calculatedFood = {
            name: foodData.name,
            calories: Math.round(foodData.calories * factor),
            protein: Math.round((foodData.protein || 0) * factor * 10) / 10,
            carbs: Math.round((foodData.carbs || 0) * factor * 10) / 10,
            fat: Math.round((foodData.fat || 0) * factor * 10) / 10,
            quantity: quantity,
            unit: "גרם"
          };

          const aiResponse = `מעולה! חישבתי עבורך ${quantity} גרם של ${foodData.name}:
• ${calculatedFood.calories} קלוריות
• ${calculatedFood.protein}g חלבון
• ${calculatedFood.carbs}g פחמימות
• ${calculatedFood.fat}g שומן

המזון נוסף לרשימת הארוחות שלך! 🎉`;

          const aiChatMessage = await chatMessageApi.create({
            message: aiResponse,
            sender: "ai",
            chat_date: today,
            created_by: user.email,
            calories_extracted: calculatedFood.calories,
            structured_data: JSON.stringify({
              text_response: aiResponse,
              summary: {
                calories: calculatedFood.calories,
                protein: calculatedFood.protein,
                carbs: calculatedFood.carbs,
                fat: calculatedFood.fat,
                meal_type: "snack"
              },
              foods: [{
                name: calculatedFood.name,
                calories: calculatedFood.calories,
                protein: calculatedFood.protein,
                carbs: calculatedFood.carbs,
                fat: calculatedFood.fat,
                category: "other"
              }]
            })
          });

          setMessages(prev => [...prev, aiChatMessage]);

          await createFoodEntry({
            food_name: calculatedFood.name,
            calories: Number(calculatedFood.calories) || 0,
            protein: Number(calculatedFood.protein) || 0,
            carbs: Number(calculatedFood.carbs) || 0,
            fat: Number(calculatedFood.fat) || 0,
            quantity: Number(calculatedFood.quantity) || 0,
            unit: "גרם",
            meal_type: "snack",
            entry_date: today,
            entry_method: "barcode",
            created_by: user.email
          });

          await chatStateApi.delete(state.id);
          window.dispatchEvent(new CustomEvent('foodEntryAdded'));

          setIsLoading(false);
          return;
        } else {
          const aiChatMessage = await chatMessageApi.create({
            message: "אנא הזן כמות תקינה בגרמים (מספר חיובי)",
            sender: "ai",
            chat_date: today,
            created_by: user.email
          });
          setMessages(prev => [...prev, aiChatMessage]);
          setIsLoading(false);
          return;
        }
      }

      // Regular AI processing
      let prompt = `אתה אסיסטנט תזונה מומחה מדויק.

${imageUrl ?
          `המשתמש שלח תמונה של מזון ${userMessage ? `עם ההודעה: "${userMessage}"` : ''}.`
          :
          `המשתמש כתב: "${userMessage}"`}

**כללי משקל קריטיים - חובה להשתמש בהם:**
- **פרוסת לחם אחת = 33 גרם.**
- **פרוסת גבינה צהובה אחת = 25 גרם.**
- **פרוסת פסטרמה אחת = 25 גרם.**

**הוראות חשובות ביותר:**
1. **זהה במדויק את המזון:** אם המשתמש כותב "גבינה צהובה 15%", אתה **חייב** לזהות את זה כגבינה עם 15% שומן.
2. **חשב כמויות:** זהה את הכמויות המדויקות.
3. **המר למשקל:** השתמש ב'כללי המשקל הקריטיים'.
4. **חשב ערכים תזונתיים:** חשב את הערכים עבור הכמות והסוג המדויקים.

**לתגובה הטקסטואלית:**
כתוב תגובה קצרה של 2-3 מילים בלבד.

**מבנה ה-JSON הנדרש:**
{
  "text_response": "תגובה קצרה",
  "summary": {
    "calories": "<סך קלוריות>",
    "protein": "<סך חלבון>",
    "carbs": "<סך פחמימות>",
    "fat": "<סך שומן>",
    "meal_type": "<breakfast|lunch|dinner|snack>"
  },
  "foods": [
    {
      "name": "שם המזון עם הכמות",
      "calories": "<קלוריות>",
      "protein": "<חלבון>",
      "carbs": "<פחמימות>",
      "fat": "<שומן>",
      "category": "<קטגוריה>"
    },
    {
      "name": "סיכום כולל",
      "calories": "<סך כל הקלוריות>",
      "protein": "<סך כל החלבון>",
      "carbs": "<סך כל הפחמידות>",
      "fat": "<סך כל השומן>",
      "category": "summary"
    }
  ]
}`;

      const aiResponseData = await InvokeLLM({
        prompt,
        file_urls: imageUrl ? [imageUrl] : undefined,
        response_json_schema: {
          type: "object",
          properties: {
            text_response: { type: "string" },
            summary: {
              type: "object",
              properties: {
                calories: { type: "number" },
                protein: { type: "number" },
                carbs: { type: "number" },
                fat: { type: "number" },
                meal_type: { type: "string", enum: ["breakfast", "lunch", "dinner", "snack"] }
              },
              required: ["calories", "protein", "carbs", "fat", "meal_type"]
            },
            foods: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  calories: { type: "number" },
                  protein: { type: "number" },
                  carbs: { type: "number" },
                  fat: { type: "number" },
                  category: { type: "string" }
                },
                required: ["name", "calories", "protein", "carbs", "fat", "category"]
              }
            }
          },
          required: ["text_response", "summary", "foods"]
        }
      });

      // Client-side calculation fix
      const individualFoods = (aiResponseData.foods || []).filter(food => food.category !== "summary");
      const calculatedTotals = individualFoods.reduce((totals, food) => {
        totals.calories += Number(food.calories || 0);
        totals.protein += Number(food.protein || 0);
        totals.carbs += Number(food.carbs || 0);
        totals.fat += Number(food.fat || 0);
        return totals;
      }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

      calculatedTotals.protein = Math.round(calculatedTotals.protein * 10) / 10;
      calculatedTotals.carbs = Math.round(calculatedTotals.carbs * 10) / 10;
      calculatedTotals.fat = Math.round(calculatedTotals.fat * 10) / 10;
      calculatedTotals.calories = Math.round(calculatedTotals.calories);

      let summaryIndex = (aiResponseData.foods || []).findIndex(food => food.category === "summary");
      const summaryFoodObject = { name: "סיכום כולל", category: "summary", ...calculatedTotals };

      if (summaryIndex !== -1) {
        aiResponseData.foods[summaryIndex] = summaryFoodObject;
      } else if (individualFoods.length > 0) {
        aiResponseData.foods.push(summaryFoodObject);
      }

      const summary = {
        ...(aiResponseData.summary || {}),
        ...calculatedTotals,
        meal_type: aiResponseData.summary?.meal_type || "snack"
      };

      if (!aiResponseData || !summary || !aiResponseData.foods) {
        throw new Error("תגובת AI לא תקינה");
      }

      const foods = (aiResponseData.foods || []).map(food => ({
        name: food.name || "מזון לא זוהה",
        calories: food.calories || 0,
        protein: food.protein || 0,
        carbs: food.carbs || 0,
        fat: food.fat || 0,
        category: food.category || "other"
      }));

      const validatedResponse = {
        text_response: aiResponseData.text_response || "זיהיתי את המזון שלך",
        summary,
        foods
      };

      const aiChatMessage = await chatMessageApi.create({
        message: validatedResponse.text_response,
        sender: "ai",
        chat_date: today,
        created_by: user.email,
        calories_extracted: summary.calories,
        structured_data: JSON.stringify(validatedResponse)
      });
      setMessages(prev => [...prev, aiChatMessage]);

      if (summary.calories > 0 || individualFoods.length > 0) {
        await createFoodEntry({
          food_name: individualFoods.map(f => f.name).join(', ') || "מזון מהצ'אט",
          calories: Number(summary.calories) || 0,
          protein: Number(summary.protein) || 0,
          carbs: Number(summary.carbs) || 0,
          fat: Number(summary.fat) || 0,
          quantity: 1,
          unit: "ארוחה",
          meal_type: summary.meal_type,
          entry_date: today,
          entry_method: "ai_chat",
          created_by: user.email
        });
        window.dispatchEvent(new CustomEvent('foodEntryAdded'));
      }

    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage = await chatMessageApi.create({
        message: "מצטער, אירעה שגיאה בעיבוד הבקשה. אנא נסה שוב.",
        sender: "ai",
        chat_date: format(new Date(), 'yyyy-MM-dd'),
        created_by: user.email
      });
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-slate-50 to-blue-50" dir="rtl">
      <style>
        {`
            .glass-effect {
              background: rgba(255, 255, 255, 0.6);
              backdrop-filter: blur(10px);
              border: 1px solid rgba(255, 255, 255, 0.2);
            }
          `}
      </style>

      <div className="flex h-full">
        {/* Sidebar */}
        <div className={`
              fixed inset-y-0 right-0 z-50 w-72 bg-white/95 backdrop-blur-sm border-l border-slate-200 shadow-xl
              transform transition-transform duration-300 ease-in-out
              md:relative md:translate-x-0 md:flex-shrink-0
              ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}
            `}>
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-6">
              <Link to={createPageUrl("Dashboard")} className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-green-500 rounded-2xl flex items-center justify-center">
                  <Apple className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                  NutriTrack
                </span>
              </Link>
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)} className="md:hidden">
                <X className="w-6 h-6" />
              </Button>
            </div>

            <nav className="flex-1 px-4 py-2 space-y-2">
              {navigationItems.map((item) => (
                <Link
                  key={item.title}
                  to={item.url}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors duration-200 ${location.pathname === item.url
                    ? 'bg-blue-100 text-blue-700 font-semibold'
                    : 'text-slate-600 hover:bg-slate-100'
                    }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.title}</span>
                </Link>
              ))}
              {isCoach && coachNavItems.map((item) => (
                <Link
                  key={item.title}
                  to={item.url}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors duration-200 ${location.pathname === item.url
                    ? 'bg-purple-100 text-purple-700 font-semibold'
                    : 'text-slate-600 hover:bg-slate-100'
                    }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.title}</span>
                </Link>
              ))}
              {isAdmin && adminNavItems.map((item) => (
                <Link
                  key={item.title}
                  to={item.url}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors duration-200 ${location.pathname === item.url
                    ? 'bg-red-100 text-red-700 font-semibold'
                    : 'text-slate-600 hover:bg-slate-100'
                    }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.title}</span>
                </Link>
              ))}
            </nav>

            <div className="p-4 mt-auto space-y-4">
              {/* Demo Mode Toggle */}
              <DemoModeToggle />

              <Button onClick={handleLogout} variant="ghost" className="w-full justify-start text-slate-600 hover:bg-slate-100">
                <LogOut className="w-5 h-5 ml-3" />
                <span>התנתקות</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Main content area */}
        <div className="flex flex-col flex-1 w-full md:w-auto overflow-hidden">
          {/* Mobile Header */}
          <header className="md:hidden flex items-center justify-between p-4 bg-white/80 backdrop-blur-sm border-b">
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-6 h-6" />
            </Button>
            <Link to={createPageUrl("Dashboard")} className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-green-500 rounded-lg flex items-center justify-center">
                <Apple className="w-5 h-5 text-white" />
              </div>
            </Link>
          </header>

          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>

      {/* Floating Chat Button and Panel */}
      {user && (
        <>
          <div className="fixed bottom-4 left-4 z-40">
            <button
              className="w-16 h-16 bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-110 flex items-center justify-center"
              onClick={() => setIsChatOpen(true)}
              title="פתח צ'אט AI"
            >
              <Bot className="w-8 h-8 text-white stroke-2" />
            </button>
          </div>

          <AnimatePresence>
            {isChatOpen && (
              <FloatingChatPanel
                onClose={() => setIsChatOpen(false)}
                messages={messages}
                newMessage={newMessage}
                setNewMessage={setNewMessage}
                isLoading={isLoading}
                uploadedImage={uploadedImage}
                setUploadedImage={setUploadedImage}
                handleSendMessage={handleSendMessage}
                handleFileUpload={handleFileUpload}
                filteredFoods={getFilteredFoods}
              />
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}

