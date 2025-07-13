
import React, { useState, useEffect } from 'react';
import { userApi } from '@/api/userApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useAuth } from '@/contexts/AuthContext'; // Add this import

export default function AdminUsers() {
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();
    const { isAdmin } = useAuth(); // Use AuthContext instead

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                // Use AuthContext instead of userApi.me()
                if (!isAdmin) {
                    console.log('User is not admin, redirecting to dashboard');
                    navigate(createPageUrl("Dashboard"));
                    return;
                }

                console.log('User is admin, fetching all users');
                const allUsers = await userApi.getAll();
                setUsers(allUsers);
            } catch (error) {
                console.error("Error fetching users or checking permissions", error);
                navigate(createPageUrl("Dashboard"));
            } finally {
                setIsLoading(false);
            }
        };
        fetchUsers();
    }, [navigate, isAdmin]); // Add isAdmin to dependencies

    const handleRoleChange = async (userId, newRoleValue) => {
        try {
            let updateData = {};
            if (newRoleValue === 'coach') {
                updateData = { role: 'user', is_coach: true };
            } else if (newRoleValue === 'user') {
                updateData = { role: 'user', is_coach: false };
            } else { // admin
                updateData = { role: 'admin', is_coach: false };
            }

            await userApi.update(userId, updateData);
            setUsers(prevUsers => prevUsers.map(user =>
                user.id === userId ? { ...user, ...updateData } : user
            ));

            // Trigger role update event for real-time UI updates
            window.dispatchEvent(new CustomEvent('userRoleUpdated'));
        } catch (error) {
            console.error("Failed to update role", error);
        }
    };

    const getUserRoleValue = (user) => {
        if (user.role === 'admin') return 'admin';
        if (user.is_coach) return 'coach';
        return 'user';
    };

    if (isLoading) {
        return <div className="p-8 text-center">טוען משתמשים...</div>;
    }

    return (
        <div className="p-4 md:p-8" dir="rtl">
            <h1 className="text-2xl font-bold mb-4 flex items-center gap-2"><Shield /> ניהול משתמשים</h1>
            <Card>
                <CardHeader>
                    <CardTitle>רשימת משתמשים</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>שם מלא</TableHead>
                                <TableHead>אימייל</TableHead>
                                <TableHead>תפקיד</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map(user => (
                                <TableRow key={user.id}>
                                    <TableCell>{user.full_name}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>
                                        <Select value={getUserRoleValue(user)} onValueChange={(value) => handleRoleChange(user.id, value)}>
                                            <SelectTrigger className="w-[180px]">
                                                <SelectValue placeholder="בחר תפקיד" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="user">משתמש</SelectItem>
                                                <SelectItem value="coach">מאמן</SelectItem>
                                                <SelectItem value="admin">אדמין</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
