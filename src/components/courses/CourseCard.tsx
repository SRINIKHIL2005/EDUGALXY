
import React from 'react';
import { Course } from '@/types';
import { BookOpen, Calendar, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { users } from '@/data/mockData';

interface CourseCardProps {
  course: Course;
  showInstructor?: boolean;
}

const CourseCard = ({ course, showInstructor = true }: CourseCardProps) => {
  // Get instructor details
  const instructor = users.find(user => user.id === course.instructor);
  
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden edu-card-hover">
      <div className="p-6">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium bg-edu-accent text-edu-primary px-2 py-1 rounded">
              {course.code}
            </span>
            <span className="text-xs text-gray-500">{course.credits} Credits</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-800">{course.name}</h3>
          {showInstructor && instructor && (
            <div className="flex items-center mt-1 text-sm text-gray-600">
              <GraduationCap size={16} className="mr-1" />
              <span>{instructor.name}</span>
            </div>
          )}
        </div>
        
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {course.description || 'No description available.'}
        </p>
        
        {course.schedule && course.schedule.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
              <Calendar size={16} className="mr-1" /> Schedule
            </h4>
            <ul className="text-sm text-gray-600 space-y-1">
              {course.schedule.map((time, index) => (
                <li key={index}>{time}</li>
              ))}
            </ul>
          </div>
        )}
        
        <div className="flex justify-end">
          <Button 
            variant="default" 
            size="sm" 
            className="bg-edu-primary hover:bg-edu-primary/90"
            asChild
          >
            <Link to={`/course/${course.id}`}>
              View Details
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CourseCard;
