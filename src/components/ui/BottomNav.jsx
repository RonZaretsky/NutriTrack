import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Home, Calendar, TrendingUp, User as UserIcon, HeartHandshake } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";

export default function BottomNav() {
    const isMobile = useIsMobile();
    const location = useLocation();
    const navigate = useNavigate();
    const { isCoach } = useAuth();

    if (!isMobile) return null;

    const navItems = [
        { label: "דשבורד", path: "/dashboard", icon: Home },
        { label: "תכנון שבועי", path: "/weeklyplan", icon: Calendar },
        { label: "התקדמות", path: "/progress", icon: TrendingUp },
        ...(isCoach ? [{ label: "מתאמנים", path: "/trainees", icon: HeartHandshake }] : []),
        { label: "פרופיל", path: "/profile", icon: UserIcon },
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex justify-around items-center h-16 shadow-md">
            {navItems.map(({ label, path, icon: Icon }) => {
                const isActive = location.pathname.startsWith(path);
                return (
                    <button
                        key={path}
                        onClick={() => navigate(path)}
                        className={`flex flex-col items-center justify-center flex-1 h-full focus:outline-none ${isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-300"}`}
                        aria-label={label}
                    >
                        <Icon className="w-6 h-6 mb-1" />
                        <span className="text-xs font-medium">{label}</span>
                    </button>
                );
            })}
        </nav>
    );
} 