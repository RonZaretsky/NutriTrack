import Layout from "./Layout.jsx";
import Dashboard from "./Dashboard";
import Profile from "./Profile";
import NutritionalSummary from "./NutritionalSummary";
import Progress from "./Progress";
import Friends from "./Friends";
import AdminLogs from "./AdminLogs";
import AdminUsers from "./AdminUsers";
import Trainees from "./Trainees";
import TraineeDetails from "./TraineeDetails";
import WeeklyPlan from "./WeeklyPlan";

// Auth pages
import Login from "./auth/Login.jsx";
import Register from "./auth/Register.jsx";
import ForgotPassword from "./auth/ForgotPassword.jsx";
import DemoTest from "./auth/DemoTest.jsx";
import SetupCheck from "./auth/SetupCheck.jsx";
import AuthCallback from "./auth/AuthCallback.jsx";
import ResetPassword from "./auth/ResetPassword.jsx";

// Auth components
import AuthChecker from "@/components/common/AuthChecker.jsx";
import { AuthProvider } from "@/contexts/AuthContext.jsx";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    Dashboard: Dashboard,
    Profile: Profile,
    NutritionalSummary: NutritionalSummary,
    Progress: Progress,
    Friends: Friends,
    AdminLogs: AdminLogs,
    AdminUsers: AdminUsers,
    Trainees: Trainees,
    TraineeDetails: TraineeDetails,
    WeeklyPlan: WeeklyPlan,
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);

    return (
        <Routes>
            {/* Public auth routes */}
            <Route path="/auth/login" element={<Login />} />
            <Route path="/auth/register" element={<Register />} />
            <Route path="/auth/forgot-password" element={<ForgotPassword />} />
            <Route path="/auth/demo-test" element={<DemoTest />} />
            <Route path="/auth/setup-check" element={<SetupCheck />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/auth/reset-password" element={<ResetPassword />} />

            {/* Protected routes with Layout */}
            <Route path="/" element={
                <AuthChecker>
                    <Layout currentPageName={currentPage}>
                        <Dashboard />
                    </Layout>
                </AuthChecker>
            } />

            <Route path="/Dashboard" element={
                <AuthChecker>
                    <Layout currentPageName="Dashboard">
                        <Dashboard />
                    </Layout>
                </AuthChecker>
            } />

            <Route path="/Profile" element={
                <AuthChecker>
                    <Layout currentPageName="Profile">
                        <Profile />
                    </Layout>
                </AuthChecker>
            } />

            <Route path="/NutritionalSummary" element={
                <AuthChecker>
                    <Layout currentPageName="NutritionalSummary">
                        <NutritionalSummary />
                    </Layout>
                </AuthChecker>
            } />

            <Route path="/Progress" element={
                <AuthChecker>
                    <Layout currentPageName="Progress">
                        <Progress />
                    </Layout>
                </AuthChecker>
            } />

            <Route path="/Friends" element={
                <AuthChecker>
                    <Layout currentPageName="Friends">
                        <Friends />
                    </Layout>
                </AuthChecker>
            } />

            <Route path="/AdminLogs" element={
                <AuthChecker>
                    <Layout currentPageName="AdminLogs">
                        <AdminLogs />
                    </Layout>
                </AuthChecker>
            } />

            <Route path="/AdminUsers" element={
                <AuthChecker>
                    <Layout currentPageName="AdminUsers">
                        <AdminUsers />
                    </Layout>
                </AuthChecker>
            } />

            <Route path="/Trainees" element={
                <AuthChecker>
                    <Layout currentPageName="Trainees">
                        <Trainees />
                    </Layout>
                </AuthChecker>
            } />

            <Route path="/TraineeDetails" element={
                <AuthChecker>
                    <Layout currentPageName="TraineeDetails">
                        <TraineeDetails />
                    </Layout>
                </AuthChecker>
            } />

            <Route path="/WeeklyPlan" element={
                <AuthChecker>
                    <Layout currentPageName="WeeklyPlan">
                        <WeeklyPlan />
                    </Layout>
                </AuthChecker>
            } />
        </Routes>
    );
}

export default function Pages() {
    return (
        <AuthProvider>
            <Router basename="/NutriTrack">
                <PagesContent />
            </Router>
        </AuthProvider>
    );
}