import React, { useState, useEffect } from "react";
import { userApi } from "@/api/userApi";
import { appLogApi } from "@/api/appLogApi";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Shield, Server, Loader2 } from "lucide-react";

export default function AdminLogs() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkPermissionsAndLoad = async () => {
      try {
        const currentUser = await userApi.me();
        if (currentUser.role === 'admin') {
          setIsAdmin(true);
          const fetchedLogs = await appLogApi.getAll(100); // Fetch last 100 logs
          setLogs(fetchedLogs);
        } else {
          // If not admin, redirect to dashboard
          navigate(createPageUrl("Dashboard"));
        }
      } catch (error) {
        // If not logged in, redirect to dashboard
        navigate(createPageUrl("Dashboard"));
      } finally {
        setIsLoading(false);
      }
    };

    checkPermissionsAndLoad();
  }, [navigate]);
  
  const getBadgeVariant = (level) => {
    switch (level) {
      case 'ERROR': return 'destructive';
      case 'WARN': return 'default'; // Yellow is not a default variant
      default: return 'secondary';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
          <p className="text-slate-600">טוען יומן מערכת...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null; // or show an access denied message, though redirect is better UX
  }

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2 flex items-center gap-3">
            <Shield className="w-8 h-8 text-blue-500" />
            יומן מערכת (Admin)
          </h1>
          <p className="text-slate-600 text-lg">
            מעקב אחר הפעולות האחרונות במערכת
          </p>
        </div>

        <Card className="glass-effect shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="w-5 h-5" />
              100 האירועים האחרונים
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>תאריך</TableHead>
                  <TableHead>משתמש</TableHead>
                  <TableHead>עמוד</TableHead>
                  <TableHead>פעולה</TableHead>
                  <TableHead>רמה</TableHead>
                  <TableHead>פרטים</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map(log => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs whitespace-nowrap">
                      {new Date(log.created_date).toLocaleString('he-IL')}
                    </TableCell>
                    <TableCell>{log.user_email}</TableCell>
                    <TableCell>{log.page}</TableCell>
                    <TableCell>{log.action}</TableCell>
                    <TableCell>
                      <Badge variant={getBadgeVariant(log.log_level)}>
                        {log.log_level}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <pre className="text-xs bg-slate-100 p-2 rounded-md max-w-xs overflow-auto">
                        <code>{log.details}</code>
                      </pre>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}