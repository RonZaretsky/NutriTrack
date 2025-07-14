
import React, { useState, useEffect } from 'react';
import { userApi } from '@/api/userApi';
import { userProfileApi } from '@/api/userProfileApi';
// Removed FoodEntry import - no longer needed
import { coachRequestApi } from '@/api/coachRequestApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { UserPlus, Loader2, AlertCircle, Send, ChevronLeft, ChevronRight } from 'lucide-react';
import { logEvent } from '@/components/utils/logger';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { format, subDays, addDays, isToday } from 'date-fns';
import { he } from 'date-fns/locale';
import { getPlannedCaloriesForDate } from '@/components/utils/weeklyPlanUtils';
import { getFoodEntriesByUserAndDate } from '@/api/foodEntryApi';
import { useAuth } from '@/contexts/AuthContext'; // Add this import

export default function TraineesPage() {
    const navigate = useNavigate();
    const [trainees, setTrainees] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [coach, setCoach] = useState(null);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newTraineeEmail, setNewTraineeEmail] = useState('');
    const [requestStatus, setRequestStatus] = useState({ loading: false, error: null, success: null });

    const { isCoach, isAdmin } = useAuth(); // Use AuthContext instead

    // Removed states related to meals and graph modals

    // Removed mealTypeTranslations as it's no longer used

    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                // Check if user is actually a coach OR admin using AuthContext
                const isCoachOrAdmin = isCoach || isAdmin;
                if (!isCoachOrAdmin) {
                    console.log('User is not coach or admin, redirecting to dashboard');
                    navigate(createPageUrl("Dashboard"));
                    return;
                }

                // Get current user data for coach operations
                const currentCoach = await userApi.me();
                setCoach(currentCoach);
                logEvent('TraineesPage', 'PAGE_LOAD', { coach: currentCoach.email, date: selectedDate });

                const traineeProfiles = await userProfileApi.filter({ coach_email: currentCoach.email });
                const dateStr = format(selectedDate, 'yyyy-MM-dd');

                const traineesWithData = await Promise.all(traineeProfiles.map(async (profile) => {
                    const foodEntries = await getFoodEntriesByUserAndDate(profile.created_by, dateStr);
                    const totalCalories = foodEntries.reduce((sum, entry) => sum + entry.calories, 0);

                    // Get dynamic planned calories for the selected date
                    const plannedCalories = await getPlannedCaloriesForDate(profile.created_by, selectedDate);

                    let fullName = profile.display_name; // Priority 1: User-edited name from UserProfile

                    if (!fullName) { // If display_name is not set, fetch full_name from User entity
                        try {
                            const userInfo = await userApi.filter({ email: profile.created_by });
                            if (userInfo.length > 0 && userInfo[0].full_name) {
                                fullName = userInfo[0].full_name; // Priority 2: Original name
                            }
                        } catch (error) {
                            console.warn(`Failed to fetch full name for ${profile.created_by}:`, error);
                            logEvent('TraineesPage', 'FETCH_FULL_NAME_ERROR', { email: profile.created_by, error: error.message }, 'WARN');
                        }
                    }

                    if (!fullName) { // Fallback to email prefix if no name is found
                        fullName = profile.created_by.split('@')[0];
                    }

                    return { ...profile, totalCalories, foodEntries, fullName, plannedCalories };
                }));

                setTrainees(traineesWithData);
            } catch (error) {
                logEvent('TraineesPage', 'LOAD_ERROR', { error: error.message }, 'ERROR');
                console.error("Error loading trainees:", error);
                // If authentication fails, redirect to dashboard
                if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
                    navigate(createPageUrl("Dashboard"));
                }
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [navigate, selectedDate, isCoach, isAdmin]); // Add isCoach and isAdmin to dependencies

    const handleSendRequest = async () => {
        if (!newTraineeEmail.trim() || !coach) return;

        setRequestStatus({ loading: true, error: null, success: null });
        const traineeEmail = newTraineeEmail.trim();
        logEvent('TraineesPage', 'SEND_REQUEST_ATTEMPT', { traineeEmail });

        try {
            // Check if coach is trying to add themselves
            if (traineeEmail === coach.email) {
                throw new Error("אינך יכול להוסיף את עצמך כמתאמן.");
            }

            // Check if a UserProfile exists for the given email. This confirms the user exists and has a profile.
            const traineeProfiles = await userProfileApi.filter({ created_by: traineeEmail });
            if (traineeProfiles.length === 0) {
                throw new Error("לא נמצא משתמש עם מייל זה, או שהמשתמש עדיין לא השלים את הגדרת הפרופיל.");
            }

            const traineeProfile = traineeProfiles[0];
            if (traineeProfile.coach_email) {
                throw new Error("למתאמן זה כבר משויך מאמן.");
            }

            // Check if a request already exists for this trainee from any coach
            const existingRequests = await coachRequestApi.filter({ trainee_email: traineeEmail });
            if (existingRequests.length > 0) {
                // Check if the request is from the *same* coach
                const requestFromThisCoach = existingRequests.find(req => req.coach_email === coach.email);
                if (requestFromThisCoach) {
                    throw new Error("כבר שלחת בקשה למתאמן זה.");
                }
                // If another coach sent a request, prevent sending a new one for now.
                throw new Error("כבר קיימת בקשה למתאמן זה ממאמן אחר.");
            }

            await coachRequestApi.create({
                coach_email: coach.email,
                coach_name: coach.full_name,
                trainee_email: traineeEmail,
            });

            setRequestStatus({ loading: false, success: "הבקשה נשלחה בהצלחה!", error: null });
            logEvent('TraineesPage', 'SEND_REQUEST_SUCCESS', { traineeEmail });
            setTimeout(() => {
                setIsAddModalOpen(false);
                setNewTraineeEmail('');
                setRequestStatus({ loading: false, success: null, error: null });
            }, 2000);

        } catch (error) {
            logEvent('TraineesPage', 'SEND_REQUEST_ERROR', { traineeEmail, error: error.message }, 'ERROR');
            setRequestStatus({ loading: false, error: error.message, success: null });
        }
    };

    const handleTraineeClick = (trainee) => {
        navigate(`${createPageUrl("TraineeDetails")}?email=${trainee.created_by}`);
    };

    const handlePreviousDay = () => {
        setSelectedDate(prevDate => subDays(prevDate, 1));
    };

    const handleNextDay = () => {
        if (!isToday(selectedDate)) {
            setSelectedDate(prevDate => addDays(prevDate, 1));
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
                    <p className="text-slate-600">טוען נתוני מתאמנים...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen" dir="rtl">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-3xl md:text-4xl font-bold text-slate-900">המתאמנים שלי</h1>
                    <Button onClick={() => setIsAddModalOpen(true)}>
                        <UserPlus className="w-4 h-4 ml-2" />
                        הוסף מתאמן חדש
                    </Button>
                </div>

                <div className="flex items-center justify-center gap-4 mb-8">
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

                {trainees.length === 0 ? (
                    <Card className="text-center p-12">
                        <CardTitle>אין לך עדיין מתאמנים</CardTitle>
                        <CardContent className="mt-4">
                            <p>לחץ על "הוסף מתאמן חדש" כדי לשלוח בקשה למתאמן.</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {trainees.map(trainee => {
                            const targetCalories = trainee.plannedCalories > 0 ? trainee.plannedCalories : trainee.daily_calories;
                            const progressValue = targetCalories > 0 ? (trainee.totalCalories / targetCalories) * 100 : 0;
                            return (
                                <Card
                                    key={trainee.id}
                                    className="glass-effect shadow-lg cursor-pointer hover:shadow-xl transition-shadow duration-200"
                                    onClick={() => handleTraineeClick(trainee)}
                                >
                                    <CardHeader>
                                        <CardTitle>{trainee.fullName}</CardTitle>
                                        <p className="text-sm text-slate-500">{trainee.created_by}</p>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            <div>
                                                <div className="flex justify-between text-sm mb-1">
                                                    <span>התקדמות קלורית</span>
                                                    <span>{Number(trainee.totalCalories).toFixed(1)} / {Number(targetCalories).toFixed(1)}</span>
                                                </div>
                                                <Progress value={progressValue} />
                                            </div>
                                            <div className="text-xs text-slate-600 grid grid-cols-3 gap-2">
                                                <p><strong>גיל:</strong> {trainee.age}</p>
                                                <p><strong>משקל:</strong> {Number(trainee.weight).toFixed(1)} ק"ג</p>
                                                <p><strong>גובה:</strong> {Number(trainee.height).toFixed(1)} ס"מ</p>
                                            </div>
                                            <div className="text-center text-sm text-slate-500 pt-2 border-t">
                                                לחץ לצפייה מפורטת
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Add Trainee Modal */}
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>שליחת בקשה למתאמן</DialogTitle>
                        <DialogDescription>הזן את כתובת המייל של המתאמן כדי לשלוח בקשת חיבור.</DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <Input
                            placeholder="trainee@example.com"
                            value={newTraineeEmail}
                            onChange={(e) => setNewTraineeEmail(e.target.value)}
                        />
                        {requestStatus.error && <p className="text-red-500 text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4" />{requestStatus.error}</p>}
                        {requestStatus.success && <p className="text-green-500 text-sm">{requestStatus.success}</p>}
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button variant="ghost">ביטול</Button></DialogClose>
                        <Button onClick={handleSendRequest} disabled={requestStatus.loading}>
                            {requestStatus.loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4 ml-2" /> שלח בקשה</>}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
