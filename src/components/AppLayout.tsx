import React, { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, LogOut } from 'lucide-react';
import AppSidebarHOD from '@/components/AppSidebarHOD';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface AppLayoutProps {
  children: ReactNode;
  pageTitle?: string;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children, pageTitle }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  // If no user, don't render the layout
  if (!user) {
    return <>{children}</>;
  }
  
  // Get user's unread notifications
  const userNotifications: any[] = []; // No notifications for now

  return (
    <div className="flex h-screen bg-background">
      <AppSidebarHOD />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header/Navbar */}
        <header className="bg-card shadow-sm z-10 border-b border-border">
          <div className="flex items-center justify-between px-6 py-4">
            <h1 className="text-2xl font-bold text-foreground">
              {pageTitle || 'Dashboard'}
            </h1>
            
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="relative">
                    <Bell size={20} />
                    {userNotifications.length > 0 && (
                      <span className="absolute top-0 right-0 w-4 h-4 bg-destructive rounded-full text-destructive-foreground text-xs flex items-center justify-center">
                        {userNotifications.length}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 bg-card border-border">
                  <div className="px-4 py-3 border-b border-border">
                    <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
                  </div>
                  {userNotifications.length === 0 ? (
                    <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                      No new notifications
                    </div>
                  ) : (
                    userNotifications.map((notification) => (
                      <DropdownMenuItem
                        key={notification.id}
                        className="px-4 py-3 cursor-pointer hover:bg-accent"
                        onClick={() => navigate(notification.link || '#')}
                      >
                        <div>
                          <p className="text-sm font-medium text-foreground">{notification.title}</p>
                          <p className="text-xs text-muted-foreground">{notification.message}</p>
                        </div>
                      </DropdownMenuItem>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              
              {/* Logout button */}
              <Button 
                variant="ghost" 
                size="icon"
                onClick={logout}
                title="Logout"
              >
                <LogOut size={20} />
              </Button>
            </div>
          </div>
        </header>
        
        {/* Main content */}
        <main className="flex-1 overflow-y-auto p-6 bg-background">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
