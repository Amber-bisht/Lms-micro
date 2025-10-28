import React, { useEffect } from "react";
import { useLocation } from "wouter";
import { useParams } from "wouter";

export default function CourseLearnPage() {
  const [_, navigate] = useLocation();
  const { courseSlug } = useParams();

  useEffect(() => {
    // Trim courseSlug to handle any trailing spaces and redirect to course videos page
    const trimmedSlug = courseSlug?.trim();
    if (trimmedSlug) {
      navigate(`/course/${trimmedSlug}/play`);
    } else {
      navigate("/");
    }
  }, [courseSlug, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Redirecting to course videos...</p>
      </div>
    </div>
  );
}
