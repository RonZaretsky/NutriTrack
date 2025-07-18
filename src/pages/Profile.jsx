
import React, { useState, useEffect } from "react";
import { userApi } from "@/api/userApi";
import { userProfileApi } from "@/api/userProfileApi";
import ProfileWizard from "@/components/profile/ProfileWizard";
import ProfileSummary from "@/components/profile/ProfileSummary";
import { Apple } from "lucide-react";
import { logEvent } from '@/components/utils/logger';
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    logEvent('Profile', 'PAGE_LOAD');
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    setIsLoading(true);
    try {
      console.log('Profile - Loading profile data...');
      const currentUser = await userApi.me();
      console.log('Profile - Current user:', currentUser);
      setUser(currentUser);

      const profiles = await userProfileApi.filter({ created_by: currentUser.email });
      console.log('Profile - Found profiles:', profiles);
      console.log('Profile - Current user email:', currentUser.email);

      if (profiles.length > 0) {
        const profile = profiles[0];
        console.log('Profile - Using profile:', profile);
        console.log('Profile - Profile setup_completed:', profile.setup_completed);
        setUserProfile(profile);
        if (!profile.setup_completed) {
          console.log('Profile - Setup not completed, showing wizard');
          setIsEditing(true);
        } else {
          console.log('Profile - Setup completed, showing summary');
        }
      } else {
        // No profile exists, force setup
        console.log('Profile - No profile found, showing wizard');
        console.log('Profile - Searching for profiles with created_by:', currentUser.email);
        setIsEditing(true);
      }
    } catch (error) {
      console.error('Profile - Error loading profile data:', error);
      // Don't create demo data - let AuthChecker handle unauthenticated users
      setUser(null);
      setUserProfile(null);
      // Don't set isEditing to true if there's an error
    } finally {
      setIsLoading(false);
      console.log('Profile - Profile data loading completed');
    }
  };

  const handleWizardSave = async () => {
    logEvent('Profile', 'WIZARD_SAVE');
    console.log('Profile - Wizard save started');
    setIsEditing(false);
    // Ensure profile data is loaded before completing
    await loadProfileData();
    console.log('Profile - Wizard save completed, profile data loaded');
  };

  const handleWizardCancel = () => {
    logEvent('Profile', 'WIZARD_CANCEL');
    // Only allow cancel if a profile already exists
    if (userProfile && userProfile.setup_completed) {
      setIsEditing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-green-500 rounded-2xl flex items-center justify-center animate-pulse">
            <Apple className="w-6 h-6 text-white" />
          </div>
          <p className="text-slate-600">טוען פרופיל...</p>
        </div>
      </div>
    );
  }

  if (isEditing) {
    return <ProfileWizard existingProfile={userProfile} onSave={handleWizardSave} onCancel={handleWizardCancel} />;
  }

  return (
    <div>
      <ProfileSummary user={user} userProfile={userProfile} onEditGoals={() => {
        logEvent('Profile', 'CLICK_EDIT_GOALS');
        setIsEditing(true);
      }} onProfileUpdate={loadProfileData} />
    </div>
  );
}
