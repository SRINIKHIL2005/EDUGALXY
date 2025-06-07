import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import ThemeToggle from '@/components/ui/theme-toggle';
import { 
  BookOpen, 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  ClipboardList, 
  Home, 
  MessageSquare, 
  Settings, 
  User, 
  Users,
  Award,
  Bot,
  Zap,
  Brain,
  Target,
  BarChart3
} from 'lucide-react';

interface SidebarLinkProps {
  to: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
  collapsed: boolean;
}

const SidebarLink: React.FC<SidebarLinkProps> = ({ to, icon, label, active, collapsed }) => (
  <Link
    to={to}
    className={cn(
      "flex items-center p-3 my-1 rounded-lg transition-all duration-200 group",
      active 
        ? "bg-sidebar-primary text-sidebar-primary-foreground" 
        : "hover:bg-sidebar-accent text-sidebar-foreground hover:text-sidebar-accent-foreground"
    )}
  >
    <div className="flex items-center">
      <span className="mr-3">{icon}</span>
      <span
        className={cn(
          "transition-all duration-200",
          collapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
        )}
      >
        {label}
      </span>
    </div>
  </Link>
);

const AppSidebar: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  // If no user, don't render the sidebar
  if (!user) return null;

  const toggleSidebar = () => setCollapsed(!collapsed);
  // Define links based on user role
  const getLinks = () => {
    const commonLinks = [
      { to: `/teacher/profile`, icon: <User size={20} />, label: 'Profile' },
    ];

    // AI Features available to all users
    const aiFeatures = [
      { to: '/ai/learning-companion', icon: <Brain size={20} />, label: 'AI Learning Companion' },
      { to: '/ai/quiz-arena', icon: <Target size={20} />, label: 'AI Quiz Arena' },
    ];

    switch (user.role) {  
      case 'student':
        return [
          { to: '/student/dashboard', icon: <Home size={20} />, label: 'Dashboard' },
          { to: '/student/Courses', icon: <BookOpen size={20} />, label: 'Courses' },
          { to: '/student/attendance', icon: <Calendar size={20} />, label: 'Attendance' },
          { to: '/student/feedback', icon: <MessageSquare size={20} />, label: 'Feedback' },
          ...aiFeatures,
          ...commonLinks,
        ];
      case 'teacher':
        return [
          { to: '/teacher/dashboard', icon: <Home size={20} />, label: 'Dashboard' },
          { to: '/teacher/Courses', icon: <BookOpen size={20} />, label: 'Manage Courses' },
          { to: '/teacher/Attendance', icon: <Calendar size={20} />, label: 'Manage Attendance' },
          { to: '/teacher/feedback', icon: <MessageSquare size={20} />, label: 'Manage Feedback' },
          { to: '/Results', icon: <Award size={20} />, label: 'Feedback Results' },
          ...aiFeatures,
          ...commonLinks,
        ];      case 'hod':
        return [
          { to: '/hod/dashboard', icon: <Home size={20} />, label: 'Dashboard' },
          { to: '/hod/courses', icon: <BookOpen size={20} />, label: 'Department Courses' },
          { to: '/hod/teachers', icon: <Users size={20} />, label: 'Manage Teachers' },
          { to: '/hod/students', icon: <Users size={20} />, label: 'Manage Students' },
          { to: '/hod/feedback', icon: <MessageSquare size={20} />, label: 'Department Feedback' },
          { to: '/hod/analytics', icon: <BarChart3 size={20} />, label: 'Analytics' },
          ...aiFeatures,
          ...commonLinks,
        ];
      default:
        return [...aiFeatures, ...commonLinks];
    }
  };

  const links = getLinks();

  return (    <aside 
      className={cn(
        "h-screen bg-sidebar-background border-r border-sidebar-border transition-all duration-300 shadow-sm flex flex-col",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        <div className={cn("flex items-center", collapsed ? "justify-center w-full" : "")}>
          {!collapsed && (
            <h1 className="text-xl font-bold text-sidebar-primary">Edu Feedback</h1>
          )}
          {collapsed && (
            <div className="w-8 h-8 rounded-full bg-sidebar-primary flex items-center justify-center">
              <span className="text-sidebar-primary-foreground font-bold">EF</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!collapsed && <ThemeToggle />}
          <button 
            onClick={toggleSidebar} 
            className="p-1 rounded-md hover:bg-sidebar-accent text-sidebar-foreground"
          >
            {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <nav className="space-y-1">
          {links.map(link => (
            <SidebarLink
              key={link.to}
              to={link.to}
              icon={link.icon}
              label={link.label}
              active={location.pathname === link.to}
              collapsed={collapsed}
            />
          ))}
        </nav>
      </div>      <div className="p-4 border-t border-sidebar-border">
        <div className={cn(
          "flex items-center", 
          collapsed ? "justify-center" : "space-x-3"
        )}>
          <div className="w-8 h-8 rounded-full bg-sidebar-accent overflow-hidden">
            {user.profilePic ? (
              <img src={user.profilePic} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-sidebar-primary text-sidebar-primary-foreground">
                {user.name?.charAt(0)}
              </div>
            )}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">{user.name}</p>
              <p className="text-xs text-sidebar-foreground/60 capitalize">{user.role}</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default AppSidebar;
