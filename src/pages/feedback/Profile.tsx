import React, { useState, useEffect, useRef } from 'react';
import { User, Mail, Calendar, BookOpen, Clock, School, Award, MapPin, Phone, Camera, Sparkles, RefreshCw } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';

interface CertificateOrResume {
  name: string;
  url: string;
  uploadedAt: string;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'student' | 'teacher';
  department?: string;
  bio?: string;
  profileImage?: string;
  joinDate?: string;
  phone?: string;
  address?: string;
  education?: {
    degree: string;
    institution: string;
    year: string;
  }[];
  specialization?: string[];
  studentId?: string;
  enrollmentYear?: string;
  program?: string;
  certificates?: CertificateOrResume[];
  resumes?: CertificateOrResume[];
}

interface PhotoUploadResponse {
  profileImage: string;
  message: string;
}

interface BioSuggestionsResponse {
  suggestions: string[];
}

interface CertificateUploadResponse {
  certificates: CertificateOrResume[];
  message: string;
}

interface ResumeUploadResponse {
  resumes: CertificateOrResume[];
  message: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const ProfilePage: React.FC = () => {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const certificateInputRef = useRef<HTMLInputElement>(null);
  const resumeInputRef = useRef<HTMLInputElement>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editableProfile, setEditableProfile] = useState<UserProfile | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isUploadingCertificate, setIsUploadingCertificate] = useState(false);
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const [bioSuggestions, setBioSuggestions] = useState<string[]>([]);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  
  // Set up axios with auth header
  const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  useEffect(() => {
    if (!user) return;

    const fetchProfileData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const profileResponse = await api.get<UserProfile>('/api/user/profile');
        setProfile(profileResponse.data);
      } catch (err) {
        console.error('Error fetching profile data:', err);
        const errorMessage = (err as any).isAxiosError && (err as any).response?.data?.message 
          ? (err as any).response.data.message 
          : 'Failed to load profile data. Please try again.';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileData();
  }, [user, token]);
  
  // Initialize editable profile when profile data is loaded
  useEffect(() => {
    if (profile) {
      setEditableProfile({ ...profile });
    }
  }, [profile]);
  
  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    // Check if there are unsaved changes
    const hasChanges = JSON.stringify(editableProfile) !== JSON.stringify(profile);
    
    if (hasChanges) {
      const confirmCancel = window.confirm(
        'You have unsaved changes. Are you sure you want to cancel?'
      );
      if (!confirmCancel) return;
    }
    
    setIsEditing(false);
    setBioSuggestions([]); // Clear any bio suggestions
    // Reset editable profile to original profile data
    setEditableProfile({ ...profile! });
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!editableProfile) return;
    
    setEditableProfile({
      ...editableProfile,
      [e.target.name]: e.target.value
    });
  };

  const handleSave = async () => {
    if (!editableProfile) return;
    
    setIsLoading(true);
    
    try {
      // Validate required fields
      if (!editableProfile.name?.trim()) {
        toast({
          title: "Validation Error",
          description: "Name is required.",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }
      
      if (!editableProfile.email?.trim()) {
        toast({
          title: "Validation Error", 
          description: "Email is required.",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }
      
      // Send updated profile to API
      await api.put('/api/user/profile', editableProfile);
      
      // Update local profile state
      setProfile(editableProfile);
      
      setIsEditing(false);
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
        variant: "default"
      });
    } catch (err) {
      console.error('Error updating profile:', err);
      const errorMessage = (err as any).response?.data?.message || 'Failed to update profile. Please try again.';
      toast({
        title: "Update Failed",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle photo upload
  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select an image smaller than 5MB.",
        variant: "destructive"
      });
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File Type",
        description: "Please select an image file.",
        variant: "destructive"
      });
      return;
    }

    setIsUploadingPhoto(true);

    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const imageData = e.target?.result as string;
        
        try {
          const response = await api.post<PhotoUploadResponse>('/api/user/profile/photo', { imageData });
          
          // Update profile with new image
          if (profile) {
            const updatedProfile = { ...profile, profileImage: response.data.profileImage };
            setProfile(updatedProfile);
            if (editableProfile) {
              setEditableProfile(updatedProfile);
            }
          }
          
          toast({
            title: "Photo Updated",
            description: response.data.message || "Your profile photo has been updated successfully.",
            variant: "default"
          });
        } catch (err) {
          console.error('Error uploading photo:', err);
          const errorMessage = (err as any).response?.data?.message || 'Failed to upload photo. Please try again.';
          toast({
            title: "Upload Failed",
            description: errorMessage,
            variant: "destructive"
          });
        } finally {
          setIsUploadingPhoto(false);
        }
      };
      
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Error processing photo:', err);
      setIsUploadingPhoto(false);
      toast({
        title: "Upload Failed",
        description: "Failed to process photo. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Generate AI bio suggestions
  const generateBioSuggestions = async () => {
    if (!profile) return;
      
    setIsGeneratingSuggestions(true);
    try {
      const response = await api.post<BioSuggestionsResponse>('/api/user/bio-suggestions', {
        currentBio: editableProfile?.bio || '',
        userRole: profile.role,
        department: profile.department
      });
      
      setBioSuggestions(response.data.suggestions || []);
      toast({
        title: "Suggestions Generated",
        description: "AI has generated bio suggestions for you.",
        variant: "default"
      });
    } catch (err) {
      console.error('Error generating bio suggestions:', err);
      toast({
        title: "Generation Failed",
        description: "Failed to generate bio suggestions. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingSuggestions(false);
    }
  };

  // Apply bio suggestion
  const applyBioSuggestion = (suggestion: string) => {
    if (editableProfile) {
      setEditableProfile({ ...editableProfile, bio: suggestion });
      setBioSuggestions([]);
    }
  };

  // Certificate upload handler
  const handleCertificateUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({ 
        title: 'File Too Large', 
        description: 'Please select a file smaller than 5MB.', 
        variant: 'destructive' 
      });
      return;
    }

    // Check file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      toast({ 
        title: 'Invalid File Type', 
        description: 'Please select a PDF or image file.', 
        variant: 'destructive' 
      });
      return;
    }

    setIsUploadingCertificate(true);
    
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const fileData = e.target?.result as string;
        
        try {
          const response = await api.post<CertificateUploadResponse>('/api/user/profile/certificate', { 
            name: file.name, 
            fileData 
          });
          
          setProfile((prev) => prev ? { ...prev, certificates: response.data.certificates } : prev);
          if (editableProfile) {
            setEditableProfile((prev) => prev ? { ...prev, certificates: response.data.certificates } : prev);
          }
          
          toast({ 
            title: 'Certificate Uploaded', 
            description: response.data.message || 'Certificate has been uploaded successfully.',
            variant: 'default' 
          });
        } catch (err) {
          console.error('Error uploading certificate:', err);
          const errorMessage = (err as any).response?.data?.message || 'Failed to upload certificate. Please try again.';
          toast({ 
            title: 'Upload Failed', 
            description: errorMessage, 
            variant: 'destructive' 
          });
        } finally {
          setIsUploadingCertificate(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Error processing certificate:', err);
      setIsUploadingCertificate(false);
      toast({ 
        title: 'Upload Failed', 
        description: 'Failed to process certificate. Please try again.', 
        variant: 'destructive' 
      });
    }
  };

  // Resume upload handler
  const handleResumeUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({ 
        title: 'File Too Large', 
        description: 'Please select a file smaller than 5MB.', 
        variant: 'destructive' 
      });
      return;
    }

    // Check file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      toast({ 
        title: 'Invalid File Type', 
        description: 'Please select a PDF or Word document.', 
        variant: 'destructive' 
      });
      return;
    }

    setIsUploadingResume(true);
    
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const fileData = e.target?.result as string;
        
        try {
          const response = await api.post<ResumeUploadResponse>('/api/user/profile/resume', { 
            name: file.name, 
            fileData 
          });
          
          setProfile((prev) => prev ? { ...prev, resumes: response.data.resumes } : prev);
          if (editableProfile) {
            setEditableProfile((prev) => prev ? { ...prev, resumes: response.data.resumes } : prev);
          }
          
          toast({ 
            title: 'Resume Uploaded', 
            description: response.data.message || 'Resume has been uploaded successfully.',
            variant: 'default' 
          });
        } catch (err) {
          console.error('Error uploading resume:', err);
          const errorMessage = (err as any).response?.data?.message || 'Failed to upload resume. Please try again.';
          toast({ 
            title: 'Upload Failed', 
            description: errorMessage, 
            variant: 'destructive' 
          });
        } finally {
          setIsUploadingResume(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Error processing resume:', err);
      setIsUploadingResume(false);
      toast({ 
        title: 'Upload Failed', 
        description: 'Failed to process resume. Please try again.', 
        variant: 'destructive' 
      });
    }
  };

  // Format date as "September 1, 2023"
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };
  
  // Show loading state
  if (isLoading) {
    return (
      <AppLayout pageTitle="My Profile">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Loading profile data...</p>
        </div>
      </AppLayout>
    );
  }
  
  // Show error state
  if (error) {
    return (
      <AppLayout pageTitle="My Profile">
        <div className="flex items-center justify-center h-64">
          <p className="text-red-500">{error}</p>
        </div>
      </AppLayout>
    );
  }

  if (!profile || !editableProfile) return null;

  // Place this inside the ProfilePage component, but inside the render/return block
  const handleAutoLocation = async (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    event.preventDefault();
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation Not Supported",
        description: "Your browser does not support location detection.",
        variant: "destructive"
      });
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          // Use a simple reverse geocoding API (e.g., OpenStreetMap Nominatim)
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          const address =
            data.display_name ||
            [data.address?.city, data.address?.state, data.address?.country]
              .filter(Boolean)
              .join(", ");
          setEditableProfile((prev) =>
            prev ? { ...prev, address: address || "" } : prev
          );
          toast({
            title: "Location Detected",
            description: "Address has been filled automatically.",
            variant: "default"
          });
        } catch (err) {
          toast({
            title: "Location Error",
            description: "Could not fetch address. Please try again.",
            variant: "destructive"
          });
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        toast({
          title: "Location Error",
          description: "Unable to detect your location.",
          variant: "destructive"
        });
        setIsLocating(false);
      }
    );
  }

  return (
    <AppLayout pageTitle="My Profile">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-800">My Profile</h2>
        <p className="text-gray-500">View and update your personal information</p>
      </div>
      
      <Tabs defaultValue="basic-info" className="w-full mb-8">
        <TabsList className="w-full max-w-md mb-6">
          <TabsTrigger value="basic-info" className="flex-1">Basic Info</TabsTrigger>
          <TabsTrigger value="academic-info" className="flex-1">
            {profile.role === 'student' ? 'Academic Info' : 'Professional Info'}
          </TabsTrigger>
        </TabsList>
        
        {/* Basic Info Tab */}
        <TabsContent value="basic-info">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Personal Information</CardTitle>
              {!isEditing ? (
                <Button onClick={handleEdit} variant="outline">Edit Profile</Button>
              ) : (
                <div className="flex gap-2">
                  <Button onClick={handleCancel} variant="outline">Cancel</Button>
                  <Button onClick={handleSave} className="bg-edu-primary hover:bg-edu-primary-dark">Save</Button>
                </div>
              )}
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-8">
                {/* Profile Image */}
                <div className="flex flex-col items-center">
                  <div className="w-32 h-32 rounded-full bg-gray-200 overflow-hidden mb-2 relative">
                    {profile.profileImage ? (
                      <img 
                        src={profile.profileImage} 
                        alt={profile.name} 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-edu-accent text-edu-primary">
                        <User size={48} />
                      </div>
                    )}
                    {isUploadingPhoto && (
                      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <RefreshCw size={24} className="text-white animate-spin" />
                      </div>
                    )}
                  </div>
                  {isEditing && (
                    <>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handlePhotoUpload}
                        accept="image/*"
                        className="hidden"
                      />
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="mt-2"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingPhoto}
                      >
                        {isUploadingPhoto ? (
                          <>
                            <RefreshCw size={16} className="mr-2 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Camera size={16} className="mr-2" />
                            Change Photo
                          </>
                        )}
                      </Button>
                    </>
                  )}
                </div>
                
                {/* Profile Form */}
                <div className="flex-1 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      {isEditing ? (
                        <Input
                          id="name"
                          name="name"
                          value={editableProfile.name}
                          onChange={handleInputChange}
                        />
                      ) : (
                        <div className="flex items-center gap-2 p-2 border rounded-md">
                          <User size={16} className="text-gray-500" />
                          <span>{profile.name}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      {isEditing ? (
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={editableProfile.email}
                          onChange={handleInputChange}
                        />
                      ) : (
                        <div className="flex items-center gap-2 p-2 border rounded-md">
                          <Mail size={16} className="text-gray-500" />
                          <span>{profile.email}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      {isEditing ? (
                        <Input
                          id="phone"
                          name="phone"
                          value={editableProfile.phone || ''}
                          onChange={handleInputChange}
                        />
                      ) : (
                        <div className="flex items-center gap-2 p-2 border rounded-md">
                          <Phone size={16} className="text-gray-500" />
                          <span>{profile.phone || 'Not provided'}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="department">Department</Label>
                      {isEditing ? (
                        <Input
                          id="department"
                          name="department"
                          value={editableProfile.department || ''}
                          onChange={handleInputChange}
                        />
                      ) : (
                        <div className="flex items-center gap-2 p-2 border rounded-md">
                          <School size={16} className="text-gray-500" />
                          <span>{profile.department || 'Not specified'}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="address">Address</Label>
                      {isEditing ? (
                        <div className="flex gap-2">
                          <Input
                            id="address"
                            name="address"
                            value={editableProfile.address || ''}
                            onChange={handleInputChange}
                          />
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={handleAutoLocation}
                            disabled={isLocating}
                            title="Auto detect location"
                          >
                            <MapPin size={16} className="mr-1" />
                            {isLocating ? 'Locating...' : 'Auto Location'}
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 p-2 border rounded-md">
                          <MapPin size={16} className="text-gray-500" />
                          <span>{profile.address || 'Not provided'}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2 md:col-span-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="bio">Bio</Label>
                        {isEditing && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={generateBioSuggestions}
                            disabled={isGeneratingSuggestions}
                          >
                            {isGeneratingSuggestions ? (
                              <>
                                <RefreshCw size={16} className="mr-2 animate-spin" />
                                Generating...
                              </>
                            ) : (
                              <>
                                <Sparkles size={16} className="mr-2" />
                                AI Suggestions
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                      {isEditing ? (
                        <div className="space-y-3">
                          <Textarea
                            id="bio"
                            name="bio"
                            value={editableProfile.bio || ''}
                            onChange={handleInputChange}
                            rows={4}
                            placeholder="Tell us about yourself..."
                          />
                          
                          {/* AI Bio Suggestions */}
                          {bioSuggestions.length > 0 && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                              <h4 className="text-sm font-medium text-blue-900 mb-3">
                                AI Bio Suggestions
                              </h4>
                              <div className="space-y-2">
                                {bioSuggestions.map((suggestion, index) => (
                                  <div
                                    key={index}
                                    className="bg-white border border-blue-200 rounded-md p-3 cursor-pointer hover:bg-blue-50 transition-colors"
                                    onClick={() => applyBioSuggestion(suggestion)}
                                  >
                                    <p className="text-sm text-gray-700">{suggestion}</p>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="mt-2 text-blue-600 hover:text-blue-800 p-0 h-auto"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        applyBioSuggestion(suggestion);
                                      }}
                                    >
                                      Use this bio
                                    </Button>
                                  </div>
                                ))}
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="mt-3 text-gray-500"
                                onClick={() => setBioSuggestions([])}
                              >
                                Close suggestions
                              </Button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="p-2 border rounded-md">
                          <p className="text-gray-700">{profile.bio || 'No bio provided.'}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Academic/Professional Info Tab */}
        <TabsContent value="academic-info">
          <Card>
            <CardHeader>
              <CardTitle>{profile.role === 'student' ? 'Academic Information' : 'Professional Information'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">                {/* Role-specific information */}
                {profile.role === 'student' ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="studentId">Student ID</Label>
                        {isEditing ? (
                          <Input
                            id="studentId"
                            name="studentId"
                            value={editableProfile?.studentId || ''}
                            onChange={handleInputChange}
                            placeholder="Enter student ID"
                          />
                        ) : (
                          <div className="flex items-center gap-2 p-2 border rounded-md">
                            <School size={16} className="text-gray-500" />
                            <span>{profile.studentId || 'Not available'}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="enrollmentYear">Enrollment Year</Label>
                        {isEditing ? (
                          <Input
                            id="enrollmentYear"
                            name="enrollmentYear"
                            value={editableProfile?.enrollmentYear || ''}
                            onChange={handleInputChange}
                            placeholder="e.g. 2023"
                          />
                        ) : (
                          <div className="flex items-center gap-2 p-2 border rounded-md">
                            <Calendar size={16} className="text-gray-500" />
                            <span>{profile.enrollmentYear || 'Not available'}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="program">Program</Label>
                        {isEditing ? (
                          <Input
                            id="program"
                            name="program"
                            value={editableProfile?.program || ''}
                            onChange={handleInputChange}
                            placeholder="e.g. Computer Science, Business Administration"
                          />
                        ) : (
                          <div className="flex items-center gap-2 p-2 border rounded-md">
                            <BookOpen size={16} className="text-gray-500" />
                            <span>{profile.program || 'Not available'}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1 md:col-span-2">
                        <span className="text-sm text-gray-500">Specializations</span>
                        <div className="flex flex-wrap gap-2">
                          {profile.specialization && profile.specialization.length > 0 ? (
                            profile.specialization.map((spec, index) => (
                              <span 
                                key={index} 
                                className="bg-edu-accent text-edu-primary px-3 py-1 rounded-full text-sm"
                              >
                                {spec}
                              </span>
                            ))
                          ) : (
                            <span className="text-gray-500">No specializations listed</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                )}
                
                <Separator />
                
                {/* Education information - for both roles */}
                <div>
                  <h3 className="text-lg font-medium mb-4">Education</h3>
                  
                  {profile.education && profile.education.length > 0 ? (
                    <div className="space-y-4">
                      {profile.education.map((edu, index) => (
                        <div key={index} className="p-4 border rounded-md">
                          <div className="flex items-center gap-2 mb-2">
                            <Award size={18} className="text-edu-primary" />
                            <span className="font-medium">{edu.degree}</span>
                          </div>
                          <div className="ml-6 text-sm text-gray-600">
                            <p>{edu.institution}</p>
                            <p>Graduated: {edu.year}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No education information available</p>
                  )}
                </div>
                
                <Separator />
                
                {/* Certificates & Resumes */}
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-medium">Certificates</h4>
                      {isEditing && (
                        <>
                          <span className="text-xs text-gray-500 mr-2">Max file size: 5MB</span>
                          <input
                            type="file"
                            ref={certificateInputRef}
                            onChange={handleCertificateUpload}
                            accept="application/pdf,image/*"
                            className="hidden"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => certificateInputRef.current?.click()}
                            disabled={isUploadingCertificate}
                          >
                            {isUploadingCertificate ? (
                              <>
                                <RefreshCw size={16} className="mr-2 animate-spin" />
                                Uploading...
                              </>
                            ) : (
                              'Upload Certificate'
                            )}
                          </Button>
                        </>
                      )}
                    </div>
                    
                    {profile.certificates && profile.certificates.length > 0 ? (
                      <div className="space-y-2">
                        {profile.certificates.map((cert, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 border rounded-md">
                            <div>
                              <a 
                                href={cert.url} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-blue-600 hover:text-blue-800 underline font-medium"
                              >
                                {cert.name}
                              </a>
                              <p className="text-xs text-gray-500 mt-1">
                                Uploaded on {formatDate(cert.uploadedAt)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500">No certificates uploaded</p>
                    )}
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-medium">Resumes</h4>
                      {isEditing && (
                        <>
                          <span className="text-xs text-gray-500 mr-2">Max file size: 5MB</span>
                          <input
                            type="file"
                            ref={resumeInputRef}
                            onChange={handleResumeUpload}
                            accept="application/pdf,.doc,.docx"
                            className="hidden"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => resumeInputRef.current?.click()}
                            disabled={isUploadingResume}
                          >
                            {isUploadingResume ? (
                              <>
                                <RefreshCw size={16} className="mr-2 animate-spin" />
                                Uploading...
                              </>
                            ) : (
                              'Upload Resume'
                            )}
                          </Button>
                        </>
                      )}
                    </div>
                    
                    {profile.resumes && profile.resumes.length > 0 ? (
                      <div className="space-y-2">
                        {profile.resumes.map((res, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 border rounded-md">
                            <div>
                              <a 
                                href={res.url} 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="text-blue-600 hover:text-blue-800 underline font-medium"
                              >
                                {res.name}
                              </a>
                              <p className="text-xs text-gray-500 mt-1">
                                Uploaded on {formatDate(res.uploadedAt)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500">No resumes uploaded</p>
                    )}
                  </div>
                </div>
                
                <Separator />
                
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-gray-500">Member since</span>
                  <div className="flex items-center gap-2 p-2 border rounded-md">
                    <Clock size={16} className="text-gray-500" />
                    <span>{formatDate(profile.joinDate)}</span>
                  </div>
                </div>
                
                {/* Edit Specializations and Education - for teachers in edit mode */}
                {isEditing && profile.role === 'teacher' && (
                  <div className="mt-6 space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Edit Specializations</h4>
                      <Input
                        type="text"
                        name="specialization"
                        value={editableProfile?.specialization?.join(', ') || ''}
                        onChange={e => setEditableProfile(editableProfile ? { 
                          ...editableProfile, 
                          specialization: e.target.value.split(',').map(s => s.trim()).filter(s => s) 
                        } : null)}
                        placeholder="Enter specializations, separated by commas"
                      />
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-2">Edit Education</h4>
                      {(editableProfile?.education || []).map((edu, idx) => (
                        <div key={idx} className="flex flex-col md:flex-row gap-2 mb-2">
                          <Input
                            type="text"
                            placeholder="Degree"
                            value={edu.degree}
                            onChange={e => {
                              const updated = [...(editableProfile?.education || [])];
                              updated[idx] = { ...updated[idx], degree: e.target.value };
                              setEditableProfile(editableProfile ? { ...editableProfile, education: updated } : null);
                            }}
                          />
                          <Input
                            type="text"
                            placeholder="Institution"
                            value={edu.institution}
                            onChange={e => {
                              const updated = [...(editableProfile?.education || [])];
                              updated[idx] = { ...updated[idx], institution: e.target.value };
                              setEditableProfile(editableProfile ? { ...editableProfile, education: updated } : null);
                            }}
                          />
                          <Input
                            type="text"
                            placeholder="Year"
                            value={edu.year}
                            onChange={e => {
                              const updated = [...(editableProfile?.education || [])];
                              updated[idx] = { ...updated[idx], year: e.target.value };
                              setEditableProfile(editableProfile ? { ...editableProfile, education: updated } : null);
                            }}
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              const updated = (editableProfile?.education || []).filter((_, i) => i !== idx);
                              setEditableProfile(editableProfile ? { ...editableProfile, education: updated } : null);
                            }}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setEditableProfile(editableProfile ? { 
                          ...editableProfile, 
                          education: [...(editableProfile.education || []), { degree: '', institution: '', year: '' }] 
                        } : null)}
                      >
                        Add Education
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
};

export default ProfilePage;