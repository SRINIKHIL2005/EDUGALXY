import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme } from '@/contexts/ThemeContext';

const ThemeToggle: React.FC = () => {
  const { theme, effectiveTheme, setTheme } = useTheme();

  const themeIcons = {
    light: Sun,
    dark: Moon,
    auto: Monitor,
  };

  const CurrentIcon = themeIcons[theme];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="relative overflow-hidden bg-background/50 backdrop-blur-sm border-border/50 hover:bg-background/80 transition-all duration-300"
        >
          <motion.div
            key={theme}
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{ 
              type: "spring", 
              stiffness: 300, 
              damping: 20 
            }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <CurrentIcon className="h-4 w-4" />
          </motion.div>
          
          {/* Animated background effect */}
          <motion.div
            initial={false}
            animate={{
              background: effectiveTheme === 'dark' 
                ? 'linear-gradient(45deg, #1e3a8a, #3730a3)'
                : 'linear-gradient(45deg, #fbbf24, #f59e0b)'
            }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 -z-10 opacity-20"
          />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="end" 
        className="w-48 bg-background/95 backdrop-blur-sm border-border/50"
      >
        <DropdownMenuItem
          onClick={() => setTheme('light')}
          className="cursor-pointer focus:bg-primary/10"
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center space-x-2 w-full"
          >
            <Sun className="h-4 w-4" />
            <span>Light Theme</span>
            {theme === 'light' && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="ml-auto w-2 h-2 bg-primary rounded-full"
              />
            )}
          </motion.div>
        </DropdownMenuItem>
        
        <DropdownMenuItem
          onClick={() => setTheme('dark')}
          className="cursor-pointer focus:bg-primary/10"
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center space-x-2 w-full"
          >
            <Moon className="h-4 w-4" />
            <span>Dark Theme</span>
            {theme === 'dark' && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="ml-auto w-2 h-2 bg-primary rounded-full"
              />
            )}
          </motion.div>
        </DropdownMenuItem>
        
        <DropdownMenuItem
          onClick={() => setTheme('auto')}
          className="cursor-pointer focus:bg-primary/10"
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center space-x-2 w-full"
          >
            <Monitor className="h-4 w-4" />
            <span>System Theme</span>
            {theme === 'auto' && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="ml-auto w-2 h-2 bg-primary rounded-full"
              />
            )}
          </motion.div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ThemeToggle;
