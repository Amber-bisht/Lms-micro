import React, { useEffect } from "react";
import { useLocation } from "wouter";
import { useParams } from "wouter";

export default function CourseLearnPage() {
  const [_, navigate] = useLocation();
  const { courseId } = useParams();

  useEffect(() => {
    // Redirect to course videos page
    if (courseId) {
      navigate(`/course-videos?id=${courseId}`);
    } else {
      navigate("/");
    }
  }, [courseId, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Redirecting to course videos...</p>
      </div>
    </div>
  );
}
