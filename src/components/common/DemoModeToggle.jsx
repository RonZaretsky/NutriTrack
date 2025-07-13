import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { demoMode } from '@/utils/demoMode';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Settings, User, Shield, Users } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function DemoModeToggle() {
  const { user, isAdmin, isCoach } = useAuth();
  const [isDemoMode, setIsDemoMode] = React.useState(demoMode.isEnabled());

  const handleToggle = () => {
    demoMode.toggle();
    setIsDemoMode(demoMode.isEnabled());
    // Reload the page to apply changes
    window.location.reload();
  };

  const switchToUser = () => {
    demoMode.enable();
    window.location.reload();
  };

  const switchToCoach = () => {
    demoMode.enable();
    // Store coach preference
    localStorage.setItem('nutri-track-demo-role', 'coach');
    window.location.reload();
  };

  const switchToAdmin = () => {
    demoMode.enable();
    // Store admin preference
    localStorage.setItem('nutri-track-demo-role', 'admin');
    window.location.reload();
  };

  const disableDemo = () => {
    demoMode.disable();
    window.location.reload();
  };

  return (
    <div className="flex items-center gap-4">
      {/* Demo Mode Toggle */}
      <div className="flex items-center space-x-2 space-x-reverse">
        <Switch
          id="demo-mode"
          checked={isDemoMode}
          onCheckedChange={handleToggle}
        />
        <Label htmlFor="demo-mode" className="text-sm">
          מצב דמו
        </Label>
      </div>

      {/* Demo Mode Badge */}
      {isDemoMode && (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
          דמו
        </Badge>
      )}

      {/* User Role Badge */}
      {user && (
        <Badge 
          variant={isAdmin ? "destructive" : isCoach ? "default" : "secondary"}
          className={isAdmin ? "bg-red-100 text-red-800" : isCoach ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"}
        >
          {isAdmin ? 'מנהל' : isCoach ? 'מאמן' : 'משתמש'}
        </Badge>
      )}

      {/* Demo Mode Menu */}
      {isDemoMode && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 ml-2" />
              החלף תפקיד
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>בחר תפקיד דמו</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={switchToUser}>
              <User className="w-4 h-4 ml-2" />
              משתמש רגיל
            </DropdownMenuItem>
            <DropdownMenuItem onClick={switchToCoach}>
              <Users className="w-4 h-4 ml-2" />
              מאמן
            </DropdownMenuItem>
            <DropdownMenuItem onClick={switchToAdmin}>
              <Shield className="w-4 h-4 ml-2" />
              מנהל
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={disableDemo}>
              <User className="w-4 h-4 ml-2" />
              כבה מצב דמו
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
} 