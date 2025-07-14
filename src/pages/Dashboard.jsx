
import React, { useState, useEffect, useRef } from "react";
import { userApi } from "@/api/userApi";
import { userProfileApi } from "@/api/userProfileApi";
import { getFoodEntriesByUserAndDate, createFoodEntry, updateFoodEntry, deleteFoodEntry } from "@/api/foodEntryApi";
import { weightEntryApi } from "@/api/weightEntryApi";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format, addDays, subDays, isToday } from "date-fns";
import { he } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Target,
  Apple,
  Scale,
  Barcode,
  Wrench,
  X,
  UserPlus, // Added for coach requests
  Check,     // Added for coach requests
  ChevronLeft, // Added for date navigation
  ChevronRight // Added for date navigation
} from "lucide-react";
import EditFoodWithAI from "../components/dashboard/EditFoodWithAI";
import BarcodeScanner from "../components/dashboard/BarcodeScanner";
import { logEvent } from '@/components/utils/logger';
import { AnimatePresence, motion } from "framer-motion";
import { coachRequestApi } from "@/api/coachRequestApi"; // Added for coach requests
import { getPlannedCaloriesForDate } from "@/components/utils/weeklyPlanUtils"; // Import the utility
import { useAuth } from "@/contexts/AuthContext";
import SummaryGraph from "@/components/nutritionalSummary/SummaryGraph";
import NutritionCard from "@/components/nutritionalSummary/NutritionCard";
import TodaysMeals from "@/components/dashboard/TodaysMeals";

export default function Dashboard() {
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading, userRole } = useAuth();
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [todaysEntries, setTodaysEntries] = useState([]);
  const [plannedCalories, setPlannedCalories] = useState(0); // New state for planned calories
  const [isLoading, setIsLoading] = useState(false); // Start with false since we wait for auth

  const [showWeightModal, setShowWeightModal] = useState(false);
  const [weightUpdatedToday, setWeightUpdatedToday] = useState(false);
  const [newWeight, setNewWeight] = useState("");
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);

  const [showEditAI, setShowEditAI] = useState(false);
  const [entryToEdit, setEntryToEdit] = useState(null);
  const [coachRequests, setCoachRequests] = useState([]); // Added state for coach requests
  const [error, setError] = useState(null); // Added error state

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [dailyFoods, setDailyFoods] = useState([]);

  // Ref to track if data has been loaded to prevent infinite loops
  const dataLoadedRef = useRef(false);
  const lastAuthStateRef = useRef(null);

  useEffect(() => {
    // Create a unique auth state identifier
    const currentAuthState = `${authLoading}-${isAuthenticated}-${userRole}`;

    // Skip if auth state hasn't changed
    if (lastAuthStateRef.current === currentAuthState) {
      return;
    }
    lastAuthStateRef.current = currentAuthState;

    console.log('Dashboard - Auth state changed:', { authLoading, isAuthenticated, userRole });

    // Only load data when auth is not loading and user is authenticated and has role
    if (!authLoading && isAuthenticated && userRole && !dataLoadedRef.current) {
      console.log('Dashboard - Loading data for authenticated user');
      logEvent('Dashboard', 'PAGE_LOAD');
      dataLoadedRef.current = true;
      loadData();
    } else if (authLoading) {
      // Reset loading state when auth is loading
      console.log('Dashboard - Auth loading, resetting loading state');
      setIsLoading(false);
      dataLoadedRef.current = false;
    } else if (!isAuthenticated) {
      // Reset when user is not authenticated
      console.log('Dashboard - User not authenticated, resetting state');
      setIsLoading(false);
      dataLoadedRef.current = false;
      // Clear user data when not authenticated
      setUser(null);
      setUserProfile(null);
      setTodaysEntries([]);
      setPlannedCalories(0);
      setCoachRequests([]);
      setWeightUpdatedToday(false);
    }

    const handleDataRefresh = () => {
      console.log('Dashboard - Food entry added, refreshing data');
      logEvent('Dashboard', 'REFRESH_ON_EVENT');
      loadData();
    };

    window.addEventListener('foodEntryAdded', handleDataRefresh);

    return () => {
      window.removeEventListener('foodEntryAdded', handleDataRefresh);
    };
  }, [authLoading, isAuthenticated, userRole, selectedDate]); // Depend on auth state and user role

  // Cleanup effect to reset loading state when component unmounts
  useEffect(() => {
    return () => {
      console.log('Dashboard - Component unmounting, cleaning up');
      setIsLoading(false);
      dataLoadedRef.current = false;
      lastAuthStateRef.current = null;
    };
  }, []);

  const loadData = async () => {
    console.log('Dashboard - Starting loadData');

    // Prevent multiple simultaneous calls
    if (isLoading) {
      console.log('Dashboard - Already loading, skipping');
      return;
    }

    // Don't load data if user is not authenticated
    if (!isAuthenticated) {
      console.log('Dashboard - User not authenticated, skipping loadData');
      return;
    }

    // Don't load data if auth is still loading
    if (authLoading) {
      console.log('Dashboard - Auth still loading, skipping loadData');
      return;
    }

    // Don't load data if user role is not available yet
    if (!userRole) {
      console.log('Dashboard - User role not available yet, skipping loadData');
      return;
    }

    setIsLoading(true);
    setError(null); // Clear any previous errors
    try {
      console.log('Dashboard - Getting current user');
      const currentUser = await userApi.me();
      console.log('Dashboard - Current user:', currentUser);
      setUser(currentUser);

      // Check if user profile exists in database
      console.log('Dashboard - Getting user profiles');
      let profiles = [];
      try {
        profiles = await userProfileApi.filter({ created_by: currentUser.email });
        console.log('Dashboard - User profiles:', profiles);
      } catch (profileError) {
        console.error('Dashboard - Error getting profiles:', profileError);
        // If profile fetch fails, create a default profile
        profiles = [];
      }

      if (profiles.length === 0 || !profiles[0].setup_completed) {
        console.log('Dashboard - No profile or setup not completed, redirecting to Profile');
        navigate(createPageUrl("Profile"));
        return;
      }
      const profile = profiles[0];
      setUserProfile(profile);

      // Fetch all data in parallel with timeouts
      const today = format(selectedDate, 'yyyy-MM-dd');
      console.log('Dashboard - Fetching all data in parallel for:', today);

      // Show loading progress
      setError(null);

      // Create promises with timeouts
      const createTimeoutPromise = (promise, timeoutMs = 5000) => {
        return Promise.race([
          promise,
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), timeoutMs)
          )
        ]);
      };

      // Fetch all data in parallel
      const [plannedCalories, requests, foodEntries, weightEntries] = await Promise.allSettled([
        createTimeoutPromise(getPlannedCaloriesForDate(currentUser.email, selectedDate)),
        createTimeoutPromise(coachRequestApi.filter({ trainee_email: currentUser.email })),
        createTimeoutPromise(getFoodEntriesByUserAndDate(currentUser.email, today)),
        createTimeoutPromise(weightEntryApi.filter({ created_by: currentUser.email, entry_date: today }))
      ]);

      // Handle results
      const todayPlannedCalories = plannedCalories.status === 'fulfilled' ? plannedCalories.value : 0;
      const coachRequests = requests.status === 'fulfilled' ? requests.value : [];
      const todaysFoodEntries = foodEntries.status === 'fulfilled' ? foodEntries.value : [];
      const todaysWeightEntries = weightEntries.status === 'fulfilled' ? weightEntries.value : [];

      console.log('Dashboard - Data loaded:', {
        plannedCalories: todayPlannedCalories,
        coachRequests: coachRequests.length,
        foodEntries: todaysFoodEntries.length,
        weightEntries: todaysWeightEntries.length
      });

      setPlannedCalories(todayPlannedCalories);
      setCoachRequests(coachRequests);
      setTodaysEntries(todaysFoodEntries);
      setDailyFoods(todaysFoodEntries); // Set dailyFoods for the graph
      setWeightUpdatedToday(todaysWeightEntries.length > 0);

      console.log('Dashboard - All data loaded successfully');

    } catch (error) {
      console.error("Dashboard - Error loading data:", error);
      // Don't fall back to demo mode - show error to user
      setError(`Failed to load data: ${error.message}`);
      // Set empty states instead of demo data
      setUser(null);
      setUserProfile(null);
      setPlannedCalories(0);
      setCoachRequests([]);
      setTodaysEntries([]);
      setDailyFoods([]); // Clear dailyFoods on error
      setWeightUpdatedToday(false);
    } finally {
      console.log('Dashboard - Setting loading to false');
      setIsLoading(false);
    }
  };

  const handleUpdateWeight = async () => {
    if (!newWeight || !userProfile) return;
    const weightValue = parseFloat(newWeight);
    if (isNaN(weightValue)) return;

    logEvent('Dashboard', 'CLICK_UPDATE_WEIGHT', { weight: weightValue });

    try {
      const todayStr = format(new Date(), 'yyyy-MM-dd');

      // Check if weight entry already exists for today
      const existingEntries = await weightEntryApi.filter({
        created_by: userProfile.created_by || user.email,
        entry_date: todayStr
      });

      if (existingEntries.length > 0) {
        // Update existing entry
        await weightEntryApi.update(existingEntries[0].id, { weight: weightValue });
      } else {
        // Create new entry
        await weightEntryApi.create({ weight: weightValue, entry_date: todayStr });
      }

      // Update current weight in profile
      await userProfileApi.update(userProfile.id, { weight: weightValue });

      setShowWeightModal(false);
      setNewWeight("");
      loadData();
    } catch (error) {
      logEvent('Dashboard', 'ERROR_UPDATING_WEIGHT', { error: error.message }, 'ERROR');
      console.error("Error updating weight:", error);
    }
  };

  const handleDeleteEntry = async (entryId) => {
    logEvent('Dashboard', 'ATTEMPT_DELETE_FOOD_ENTRY', { entryId });
    if (confirm("האם אתה בטוח שברצונך למחוק את הפריט הזה?")) {
      try {
        await deleteFoodEntry(entryId);
        logEvent('Dashboard', 'CONFIRM_DELETE_FOOD_ENTRY', { entryId });
        // Update state directly for smooth removal instead of full reload
        setTodaysEntries(prevEntries => prevEntries.filter(entry => entry.id !== entryId));
        setDailyFoods(prevFoods => prevFoods.filter(food => food.id !== entryId)); // Update dailyFoods
      } catch (error) {
        logEvent('Dashboard', 'ERROR_DELETING_ENTRY', { entryId, error: error.message }, 'ERROR');
        console.error("Error deleting entry:", error);
      }
    } else {
      logEvent('Dashboard', 'CANCEL_DELETE_FOOD_ENTRY', { entryId });
    }
  };

  const handleEditWithAI = (entry) => {
    logEvent('Dashboard', 'CLICK_EDIT_WITH_AI', { entryId: entry.id, foodName: entry.food_name });
    setEntryToEdit(entry);
    setShowEditAI(true);
  };

  const handleEditSave = () => {
    setShowEditAI(false);
    setEntryToEdit(null);
    loadData();
  };

  const handleEditClose = () => {
    setShowEditAI(false);
    setEntryToEdit(null);
  };

  const handleBarcodeScanned = async (foodData) => {
    logEvent('Dashboard', 'BARCODE_SCANNED', { foodName: foodData.name, barcode: foodData.barcode });

    // Close the scanner modal
    setShowBarcodeScanner(false);

    // Open chat and add the food data message
    const today = format(new Date(), 'yyyy-MM-dd');
    const { chatMessageApi } = await import('@/api/chatMessageApi');
    const { chatStateApi } = await import('@/api/chatStateApi');

    // Create AI message with food data
    const aiResponse = `🎯 מצאתי את המוצר: **${foodData.name}**

📊 ערכים תזונתיים ל-100 גרם:
• ${foodData.calories} קלוריות
• ${foodData.protein}g חלבון
• ${foodData.carbs}g פחמימות  
• ${foodData.fat}g שומן

❓ כמה גרם אכלת מהמוצר הזה?`;

    const aiChatMessage = await chatMessageApi.create({
      message: aiResponse,
      sender: "ai",
      chat_date: today,
      created_by: user.email,
      structured_data: JSON.stringify({
        text_response: aiResponse,
        summary: {
          calories: foodData.calories,
          protein: foodData.protein,
          carbs: foodData.carbs,
          fat: foodData.fat,
          meal_type: "snack" // Default to snack, user can change later if needed
        },
        foods: [{
          name: foodData.name,
          calories: foodData.calories,
          protein: foodData.protein,
          carbs: foodData.carbs,
          fat: foodData.fat,
          category: "other" // Default category
        }]
      })
    });

    // Save state for quantity input
    await chatStateApi.create({
      user_email: user.email,
      state_type: 'waiting_for_quantity',
      food_data: JSON.stringify(foodData),
      barcode: foodData.barcode,
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10 minutes
    });

    // Trigger chat to open and refresh
    window.dispatchEvent(new CustomEvent('openChatWithMessage', {
      detail: { message: aiChatMessage }
    }));
  };

  const handleCoachRequest = async (request, accept) => {
    try {
      if (accept) {
        // Only update coach_email, remove coach_name since the column doesn't exist
        await userProfileApi.update(userProfile.id, {
          coach_email: request.coach_email
          // Remove coach_name: coachName - this column doesn't exist
        });
        logEvent('Dashboard', 'COACH_REQUEST_ACCEPTED', { coach_email: request.coach_email });
      } else {
        logEvent('Dashboard', 'COACH_REQUEST_DECLINED', { coach_email: request.coach_email });
      }
      await coachRequestApi.delete(request.id);
      loadData(); // Refresh data
    } catch (error) {
      logEvent('Dashboard', 'ERROR_HANDLING_COACH_REQUEST', { error: error.message }, 'ERROR');
      console.error("Error handling coach request", error);
    }
  };

  const totalCalories = todaysEntries.reduce((sum, entry) => sum + (entry.calories || 0), 0);

  const getGoalText = () => {
    if (!userProfile) return "";
    switch (userProfile.goal) {
      case "lose": return "ירידה במשקל";
      case "gain": return "עלייה במשקל";
      case "maintain": return "שמירה על המשקל";
      default: return "";
    }
  };

  const handlePreviousDay = () => {
    setSelectedDate(prevDate => subDays(prevDate, 1));
  };
  const handleNextDay = () => {
    if (!isToday(selectedDate)) {
      setSelectedDate(prevDate => addDays(prevDate, 1));
    }
  };

  // Show loading spinner while auth is loading or dashboard is loading
  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-green-500 rounded-2xl flex items-center justify-center animate-pulse">
            <Apple className="w-6 h-6 text-white" />
          </div>
          <p className="text-slate-600">
            {authLoading ? 'בודק אותנטיקציה...' : 'טוען את הנתונים שלך...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full">
      <div className="sticky top-0 z-20 bg-gradient-to-br from-slate-50 to-blue-50/90 backdrop-blur-sm p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
                שלום, {userProfile?.display_name || user?.full_name || "משתמש"}! 👋
              </h1>
              <p className="text-slate-600 text-lg">
                {isToday(selectedDate) ? "היום" : format(selectedDate, 'EEEE, d MMMM yyyy', { locale: he })}
              </p>
              {userProfile && (
                <Badge variant="outline" className="mt-2 bg-blue-50 text-blue-700 border-blue-200">
                  <Target className="w-4 h-4 mr-1" />
                  {getGoalText()}
                </Badge>
              )}
            </div>
            <div className="flex gap-2 w-full md:w-auto flex-wrap justify-start md:justify-end">
              <Button
                onClick={() => {
                  setShowWeightModal(true);
                  logEvent('Dashboard', 'OPEN_WEIGHT_MODAL');
                }}
                variant="outline"
                className={`flex-grow md:flex-grow-0 border-blue-300 hover:bg-blue-50 smooth-transition relative ${!weightUpdatedToday ? 'animate-pulse-strong' : ''}`}
              >
                <Scale className="w-4 h-4 mr-2" />
                עדכן משקל
              </Button>
              <Button
                onClick={() => {
                  setShowBarcodeScanner(true);
                  logEvent('Dashboard', 'OPEN_BARCODE_SCANNER');
                }}
                className="flex-grow md:flex-grow-0 bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 smooth-transition shadow-lg"
              >
                <Barcode className="w-4 h-4 mr-2" />
                סרוק ברקוד
              </Button>
            </div>
          </div>
        </div>
        {/* Date Navigation */}
        <div className="flex items-center justify-center gap-4 mt-4 mb-4">
          <Button variant="outline" size="icon" onClick={handlePreviousDay}>
            <ChevronRight className="w-4 h-4" />
          </Button>
          <h2 className="text-xl font-semibold text-slate-800 w-64 text-center">
            {isToday(selectedDate) ? "היום" : format(selectedDate, 'EEEE, d MMMM', { locale: he })}
          </h2>
          <Button variant="outline" size="icon" onClick={handleNextDay} disabled={isToday(selectedDate)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="p-4 md:p-8 pt-0">
        {/* Coach Requests */}
        {coachRequests.length > 0 && coachRequests.map(request => (
          <Card key={request.id} className="glass-effect shadow-lg mb-8 border-r-4 border-r-purple-500">
            <CardContent className="p-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                    <UserPlus className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-slate-900">
                      בקשת אימון חדשה!
                    </h3>
                    <p className="text-slate-600">
                      המאמן <span className="font-medium">{request.coach_name}</span> רוצה לאמן אותך.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCoachRequest(request, false)}
                    className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
                  >
                    <X className="w-4 h-4 mr-2" />
                    דחה
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleCoachRequest(request, true)}
                    className="bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    אשר
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Basic Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 mt-8">
          <Card className="glass-effect shadow-lg">
            <CardHeader>
              <CardTitle>משקל נוכחי</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                {userProfile?.weight || 0}
              </div>
              <p className="text-slate-600">קילוגרם</p>
            </CardContent>
          </Card>

          <Card className="glass-effect shadow-lg">
            <CardHeader>
              <CardTitle>ארוחות היום</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">
                {todaysEntries.length}
              </div>
              <p className="text-slate-600">פריטים</p>
            </CardContent>
          </Card>
        </div>

        {/* Summary graph directly under date navigation */}
        <SummaryGraph foods={dailyFoods} dailyCalorieTarget={plannedCalories || userProfile?.daily_calories || 2000} />

        {/* Weight Modal */}
        {showWeightModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  עדכון משקל יומי
                  <Button variant="ghost" size="sm" onClick={() => setShowWeightModal(false)}>✕</Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 mb-4">הזן את המשקל העדכני שלך בק״ג.</p>
                <Input
                  type="number"
                  step="0.1"
                  placeholder={`משקל נוכחי: ${userProfile?.weight || ''} ק״ג`}
                  value={newWeight}
                  onChange={(e) => setNewWeight(e.target.value)}
                  className="text-right"
                />
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" onClick={() => setShowWeightModal(false)}>ביטול</Button>
                  <Button onClick={handleUpdateWeight} disabled={!newWeight}>עדכן</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Barcode Scanner */}
        <BarcodeScanner
          isOpen={showBarcodeScanner}
          onClose={() => setShowBarcodeScanner(false)}
          onBarcodeScanned={handleBarcodeScanned}
        />

        {/* Edit with AI Modal */}
        {showEditAI && entryToEdit && (
          <EditFoodWithAI
            entry={entryToEdit}
            onClose={handleEditClose}
            onSave={handleEditSave}
          />
        )}

        {/* Today's Entries */}
        <TodaysMeals entries={todaysEntries} onDelete={handleDeleteEntry} onEditWithAI={handleEditWithAI} />
      </div>
    </div>
  );
}
