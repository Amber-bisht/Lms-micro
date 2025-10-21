import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  User, 
  Mail, 
  Github, 
  Linkedin, 
  Twitter,
  Code,
  BookOpen,
  Building,
  Briefcase,
  Trash2,
  Save,
  ArrowLeft
} from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

interface ProfileData {
  fullName: string;
  bio: string;
  interest: string;
  email: string;
  githubLink: string;
  linkedinLink: string;
  xLink: string;
  codeforcesLink: string;
  leetcodeLink: string;
  collegeName: string;
  companyName: string;
  isPlaced: boolean;
}

const INTERESTS = [
  "web-development",
  "data-science", 
  "mobile-development",
  "game-development",
  "devops",
  "cybersecurity",
  "machine-learning",
  "blockchain"
];

const DELETION_REASONS = [
  { value: "no_longer_interested", label: "No longer interested" },
  { value: "found_better_platform", label: "Found a better platform" },
  { value: "too_many_emails", label: "Too many emails" },
  { value: "privacy_concerns", label: "Privacy concerns" },
  { value: "technical_issues", label: "Technical issues" },
  { value: "not_what_expected", label: "Not what I expected" },
  { value: "other", label: "Other" }
];

export default function ProfileEditPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletionReason, setDeletionReason] = useState("");
  const [deletionFeedback, setDeletionFeedback] = useState("");

  const [profileData, setProfileData] = useState<ProfileData>({
    fullName: "",
    bio: "",
    interest: "",
    email: "",
    githubLink: "",
    linkedinLink: "",
    xLink: "",
    codeforcesLink: "",
    leetcodeLink: "",
    collegeName: "",
    companyName: "",
    isPlaced: false
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        fullName: user.fullName || "",
        bio: user.bio || "",
        interest: user.interest || "",
        email: user.email || "",
        githubLink: user.githubLink || "",
        linkedinLink: user.linkedinLink || "",
        xLink: user.xLink || "",
        codeforcesLink: user.codeforcesLink || "",
        leetcodeLink: user.leetcodeLink || "",
        collegeName: user.collegeName || "",
        companyName: user.companyName || "",
        isPlaced: user.isPlaced || false
      });
    }
  }, [user]);

  const handleInputChange = (field: keyof ProfileData, value: string | boolean) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Remove email and fullName from the data being sent
      const { email, fullName, ...updateableData } = profileData;
      
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_BACKEND_URL;
      if (!API_BASE_URL) throw new Error('API base URL not configured');
      const response = await fetch(`${API_BASE_URL}/api/profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updateableData)
      });

      if (response.ok) {
        toast({
          title: "Profile Updated",
          description: "Your profile has been updated successfully!",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || "Failed to update profile",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletionReason) {
      toast({
        title: "Error",
        description: "Please select a reason for deletion",
        variant: "destructive"
      });
      return;
    }

    setDeleteLoading(true);

    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_BACKEND_URL;
      if (!API_BASE_URL) throw new Error('API base URL not configured');
      const response = await fetch(`${API_BASE_URL}/api/profile/account`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          reason: deletionReason,
          feedback: deletionFeedback
        })
      });

      if (response.ok) {
        toast({
          title: "Account Deleted",
          description: "Your account has been deleted successfully.",
        });
        // Redirect to home page
        window.location.href = '/';
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.message || "Failed to delete account",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete account",
        variant: "destructive"
      });
    } finally {
      setDeleteLoading(false);
      setShowDeleteDialog(false);
    }
  };

  if (!user) return null;

  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      
      <main className="flex-1 py-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <Button asChild variant="ghost" className="mb-4">
              <Link href="/profile">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Profile
              </Link>
            </Button>
            
            <h1 className="text-3xl font-bold">Edit Profile</h1>
            <p className="text-muted-foreground mt-2">
              Update your profile information and social links
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="mr-2 h-5 w-5" />
                  Basic Information
                </CardTitle>
                <CardDescription>
                  Your personal information and contact details. Note: Email and full name cannot be changed after account creation.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      value={profileData.fullName}
                      disabled
                      placeholder="Full name cannot be changed"
                      className="bg-gray-100 cursor-not-allowed"
                    />
                    <p className="text-sm text-muted-foreground">Full name cannot be modified after account creation</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileData.email}
                      disabled
                      placeholder="Email cannot be changed"
                      className="bg-gray-100 cursor-not-allowed"
                    />
                    <p className="text-sm text-muted-foreground">Email cannot be modified after account creation</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={profileData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    placeholder="Tell us about yourself..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="interest">Area of Interest</Label>
                  <Select 
                    value={profileData.interest} 
                    onValueChange={(value) => handleInputChange('interest', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your interest" />
                    </SelectTrigger>
                    <SelectContent>
                      {INTERESTS.map((interest) => (
                        <SelectItem key={interest} value={interest}>
                          {interest.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Social Links */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Github className="mr-2 h-5 w-5" />
                  Social Links
                </CardTitle>
                <CardDescription>
                  Add your social media and coding platform profiles
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="githubLink">GitHub Profile</Label>
                    <Input
                      id="githubLink"
                      value={profileData.githubLink}
                      onChange={(e) => handleInputChange('githubLink', e.target.value)}
                      placeholder="https://github.com/username"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="linkedinLink">LinkedIn Profile</Label>
                    <Input
                      id="linkedinLink"
                      value={profileData.linkedinLink}
                      onChange={(e) => handleInputChange('linkedinLink', e.target.value)}
                      placeholder="https://linkedin.com/in/username"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="xLink">X (Twitter) Profile</Label>
                    <Input
                      id="xLink"
                      value={profileData.xLink}
                      onChange={(e) => handleInputChange('xLink', e.target.value)}
                      placeholder="https://x.com/username"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="codeforcesLink">Codeforces Profile</Label>
                    <Input
                      id="codeforcesLink"
                      value={profileData.codeforcesLink}
                      onChange={(e) => handleInputChange('codeforcesLink', e.target.value)}
                      placeholder="https://codeforces.com/profile/username"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="leetcodeLink">LeetCode Profile</Label>
                  <Input
                    id="leetcodeLink"
                    value={profileData.leetcodeLink}
                    onChange={(e) => handleInputChange('leetcodeLink', e.target.value)}
                    placeholder="https://leetcode.com/username"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Education & Career */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="mr-2 h-5 w-5" />
                  Education & Career
                </CardTitle>
                <CardDescription>
                  Your educational background and career information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="collegeName">College/University</Label>
                    <Input
                      id="collegeName"
                      value={profileData.collegeName}
                      onChange={(e) => handleInputChange('collegeName', e.target.value)}
                      placeholder="Enter your college name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company (if placed)</Label>
                    <Input
                      id="companyName"
                      value={profileData.companyName}
                      onChange={(e) => handleInputChange('companyName', e.target.value)}
                      placeholder="Enter your company name"
                    />
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="isPlaced"
                    checked={profileData.isPlaced}
                    onCheckedChange={(checked) => handleInputChange('isPlaced', checked as boolean)}
                  />
                  <Label htmlFor="isPlaced">
                    I am placed (We will soon add a job section where you can get seen by recruiters)
                  </Label>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-between items-center">
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>

              <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Account</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="deletionReason">Reason for deletion *</Label>
                      <Select 
                        value={deletionReason} 
                        onValueChange={setDeletionReason}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a reason" />
                        </SelectTrigger>
                        <SelectContent>
                          {DELETION_REASONS.map((reason) => (
                            <SelectItem key={reason.value} value={reason.value}>
                              {reason.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="deletionFeedback">Additional feedback (optional)</Label>
                      <Textarea
                        id="deletionFeedback"
                        value={deletionFeedback}
                        onChange={(e) => setDeletionFeedback(e.target.value)}
                        placeholder="Tell us more about why you're leaving..."
                        rows={3}
                      />
                    </div>
                  </div>

                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      disabled={deleteLoading || !deletionReason}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {deleteLoading ? "Deleting..." : "Delete Account"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </form>
        </div>
      </main>
      
      <SiteFooter />
    </div>
  );
} 