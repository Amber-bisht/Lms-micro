import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Mail, 
  Calendar, 
  BookOpen, 
  Building,
  Briefcase,
  Github,
  Linkedin,
  Twitter,
  Code,
  Award,
  Clock,
  Activity
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'wouter';
import { useLocation } from 'wouter';

interface UserProfileViewProps {
  userId: string;
  username: string;
  avatar?: string;
  fullName?: string;
  isOpen: boolean;
  onClose: () => void;
}

interface UserProfile {
  _id: string;
  username: string;
  email?: string;
  avatar?: string;
  fullName?: string;
  bio?: string;
  interest?: string;
  collegeName?: string;
  companyName?: string;
  isPlaced?: boolean;
  githubLink?: string;
  linkedinLink?: string;
  xLink?: string;
  codeforcesLink?: string;
  leetcodeLink?: string;
  createdAt: string;
  updatedAt: string;
}

interface UserEnrollment {
  _id: string;
  course?: {
    _id: string;
    title: string;
    thumbnail?: string;
    description?: string;
    slug: string;
  } | null;
  enrolledAt: string;
  completedAt?: string;
  progress?: number;
  isCompleted?: boolean;
}

export default function UserProfileView({ 
  userId, 
  username, 
  avatar, 
  fullName, 
  isOpen, 
  onClose 
}: UserProfileViewProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'courses'>('profile');

  // Fetch user profile data
  const { data: userProfile, isLoading: loadingProfile } = useQuery<UserProfile>({
    queryKey: [`/api/users/${userId}/profile`],
    enabled: isOpen && !!userId,
  });

  // Fetch user enrollments
  const { data: enrollments, isLoading: loadingEnrollments } = useQuery<UserEnrollment[]>({
    queryKey: [`/api/users/${userId}/enrollments`],
    enabled: isOpen && !!userId,
  });

  const displayName = fullName || username;
  const displayAvatar = avatar || userProfile?.avatar;
  const displayBio = userProfile?.bio || 'No bio available';
  const displayInterest = userProfile?.interest || 'Not specified';
  const displayCollege = userProfile?.collegeName || 'Not specified';
  const displayCompany = userProfile?.companyName || 'Not specified';
  const displayIsPlaced = userProfile?.isPlaced || false;

  const joinedDate = userProfile?.createdAt ? new Date(userProfile.createdAt) : null;
  const lastActive = userProfile?.updatedAt ? new Date(userProfile.updatedAt) : null;

  // Calculate login days (simplified - using days since creation)
  const loginDays = joinedDate ? Math.ceil((Date.now() - joinedDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={displayAvatar} alt={displayName} />
              <AvatarFallback>{displayName.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <div className="text-xl font-bold">{displayName}</div>
              <div className="text-sm text-muted-foreground">@{username}</div>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Tab Navigation */}
        <div className="flex space-x-1 border-b">
          <Button
            variant={activeTab === 'profile' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('profile')}
            className="flex-1"
          >
            Profile
          </Button>
          <Button
            variant={activeTab === 'courses' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('courses')}
            className="flex-1"
          >
            Courses ({enrollments?.length || 0})
          </Button>
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            {/* Basic Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {userProfile?.email || 'Email not provided'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      Joined {joinedDate ? formatDistanceToNow(joinedDate, { addSuffix: true }) : 'Unknown'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {loginDays} days on platform
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      Last active {lastActive ? formatDistanceToNow(lastActive, { addSuffix: true }) : 'Unknown'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bio */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Bio
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{displayBio}</p>
              </CardContent>
            </Card>

            {/* Education & Career */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Education & Career
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    <strong>College:</strong> {displayCollege}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    <strong>Company:</strong> {displayCompany}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    <strong>Placement Status:</strong> 
                    <Badge variant={displayIsPlaced ? 'default' : 'secondary'} className="ml-2">
                      {displayIsPlaced ? 'Placed' : 'Not Placed'}
                    </Badge>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    <strong>Interests:</strong> {displayInterest}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Social Links */}
            {(userProfile?.githubLink || userProfile?.linkedinLink || userProfile?.xLink || 
              userProfile?.codeforcesLink || userProfile?.leetcodeLink) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="h-5 w-5" />
                    Social & Coding Profiles
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {userProfile?.githubLink && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={userProfile.githubLink} target="_blank" rel="noopener noreferrer">
                          <Github className="h-4 w-4 mr-2" />
                          GitHub
                        </a>
                      </Button>
                    )}
                    {userProfile?.linkedinLink && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={userProfile.linkedinLink} target="_blank" rel="noopener noreferrer">
                          <Linkedin className="h-4 w-4 mr-2" />
                          LinkedIn
                        </a>
                      </Button>
                    )}
                    {userProfile?.xLink && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={userProfile.xLink} target="_blank" rel="noopener noreferrer">
                          <Twitter className="h-4 w-4 mr-2" />
                          X (Twitter)
                        </a>
                      </Button>
                    )}
                    {userProfile?.codeforcesLink && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={userProfile.codeforcesLink} target="_blank" rel="noopener noreferrer">
                          <Code className="h-4 w-4 mr-2" />
                          Codeforces
                        </a>
                      </Button>
                    )}
                    {userProfile?.leetcodeLink && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={userProfile.leetcodeLink} target="_blank" rel="noopener noreferrer">
                          <Code className="h-4 w-4 mr-2" />
                          LeetCode
                        </a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Courses Tab */}
        {activeTab === 'courses' && (
          <div className="space-y-4">
            {loadingEnrollments ? (
              <div className="text-center py-8">Loading courses...</div>
            ) : enrollments && enrollments.length > 0 ? (
              <div className="space-y-4">
                <div className="grid gap-4">
                  {enrollments.map((enrollment) => (
                    <Card key={enrollment._id}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          {enrollment.course?.thumbnail && (
                            <img 
                              src={enrollment.course.thumbnail} 
                              alt={enrollment.course?.title || 'Course'}
                              className="w-16 h-16 object-cover rounded-lg"
                            />
                          )}
                          <div className="flex-1">
                            <h4 className="font-semibold">
                              {enrollment.course?.title || 'Course Information Hidden'}
                            </h4>
                            {enrollment.course?.description && (
                              <p className="text-sm text-muted-foreground mb-2">
                                {enrollment.course.description}
                              </p>
                            )}
                            <div className="flex items-center gap-4 text-sm">
                              <span>Enrolled: {formatDistanceToNow(new Date(enrollment.enrolledAt), { addSuffix: true })}</span>
                              {enrollment.progress !== undefined && (
                                <span>Progress: {enrollment.progress}%</span>
                              )}
                              {enrollment.isCompleted ? (
                                <Badge variant="default">Completed</Badge>
                              ) : (
                                <Badge variant="secondary">In Progress</Badge>
                              )}
                            </div>
                            {enrollment.course?.slug && (
                              <div className="mt-3">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    // Since we don't have category info, redirect to a general course page
                                    // This will need to be updated when category info is available
                                    window.location.href = `/course/${enrollment.course!.slug}`;
                                  }}
                                >
                                  View Course Details
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No courses enrolled yet.
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
