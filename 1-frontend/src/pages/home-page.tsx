import React from "react";
import { Link } from "wouter";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { Button } from "@/components/ui/button";
import { Code, Zap, Rocket, Brain, Terminal, ArrowRight, Sparkles, Star, Play } from "lucide-react";
import { initPerformanceMonitoring } from "@/lib/performance-monitor";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Course } from "@/schema";
import { apiGet } from "@/lib/api";

export default function HomePage() {
  const [_, navigate] = useLocation();

  // Fetch all courses
  const { data: courses = [], isLoading, error } = useQuery<Course[]>({
    queryKey: ['courses'],
    queryFn: async () => {
      console.log('Fetching courses...');
      const response = await apiGet('/api/courses');
      const data = await response.json();
      console.log('Courses fetched:', data);
      return data;
    },
    retry: 3,
    retryDelay: 1000,
  });

  // Initialize performance monitoring
  React.useEffect(() => {
    initPerformanceMonitoring();
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <SiteHeader />
      
      <main className="flex-1">
        {/* Hero Section - Unique Design */}
        <section className="relative overflow-hidden bg-white dark:bg-black">
          {/* Animated Background Elements */}
          

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left Content */}
              <div className="space-y-8">
                <div className="inline-flex items-center px-6 py-3 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-black dark:text-white text-sm font-medium">
                  <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                  <span className="text-black dark:text-white">🚀 Next-Gen Learning Platform</span>
                </div>
                
                <h1 className="text-6xl md:text-7xl lg:text-8xl font-black text-black dark:text-white leading-tight">
                  Learn to <span className="text-black dark:text-white">Code</span>
                </h1>
                
                <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 leading-relaxed max-w-2xl">
                  Master modern technologies with hands-on projects, real-world applications, and expert guidance.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button 
                    size="lg" 
                    className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 px-8 py-4 text-lg font-semibold rounded-2xl transition-all duration-300 hover:scale-105"
                    onClick={() => navigate('/')}
                  >
                    Start Learning
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 px-8 py-4 text-lg font-semibold rounded-2xl transition-all duration-300"
                    onClick={() => navigate('/about-project')}
                  >
                    Learn More
                  </Button>
                </div>
              </div>

              {/* Right Visual */}
              <div className="relative">
                <div className="relative z-10 bg-gray-100 dark:bg-gray-800 rounded-3xl p-8 border border-gray-200 dark:border-gray-700">
                  <div className="bg-gray-200 dark:bg-gray-900 rounded-2xl p-6 border border-gray-300 dark:border-gray-600">
                    <div className="flex items-center space-x-2 mb-4">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    </div>
                    <div className="space-y-3 font-mono text-sm">
                      <div className="text-blue-600 dark:text-blue-400">
                        <span className="text-purple-600 dark:text-purple-400">fn</span> <span className="text-yellow-600 dark:text-yellow-400">main</span>() <span className="text-purple-600 dark:text-purple-400">{'{'}</span>
                      </div>
                      <div className="text-gray-800 dark:text-white ml-4">
                        <span className="text-blue-600 dark:text-blue-400">let</span> developer = <span className="text-green-600 dark:text-green-400">"you"</span>;
                      </div>
                      <div className="text-gray-800 dark:text-white ml-4">
                        <span className="text-blue-600 dark:text-blue-400">if</span> developer == <span className="text-green-600 dark:text-green-400">"you"</span> <span className="text-purple-600 dark:text-purple-400">{'{'}</span>
                      </div>
                      <div className="text-gray-800 dark:text-white ml-8">
                        <span className="text-yellow-600 dark:text-yellow-400">learn</span>(<span className="text-green-600 dark:text-green-400">"rust"</span>);
                      </div>
                      <div className="text-gray-800 dark:text-white ml-8">
                        <span className="text-yellow-600 dark:text-yellow-400">build_awesome</span>(<span className="text-green-600 dark:text-green-400">"projects"</span>);
                      </div>
                      <div className="text-gray-800 dark:text-white ml-4">
                        <span className="text-purple-600 dark:text-purple-400">{'}'}</span>
                      </div>
                      <div className="text-purple-600 dark:text-purple-400">
                        <span className="text-purple-600 dark:text-purple-400">{'}'}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Floating Elements */}
                <div className="absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center animate-bounce">
                  <Rocket className="w-8 h-8 text-white" />
                </div>
                <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-gradient-to-br from-green-400 to-blue-500 rounded-full flex items-center justify-center animate-pulse">
                  <Code className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Courses Section */}
        <section className="py-20 bg-white dark:bg-black">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-20">
              <div className="inline-flex items-center px-6 py-3 rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium mb-6">
                <Brain className="w-4 h-4 mr-2" />
                <span>Available Courses</span>
              </div>
              <h2 className="text-5xl md:text-6xl font-black text-black dark:text-white mb-6">
                All <span className="text-black dark:text-white">Courses</span>
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
                Browse and learn from our comprehensive collection of courses.
              </p>
            </div>

            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-300">Loading courses...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-600 dark:text-red-400 mb-4">Error loading courses: {error.message}</p>
                <Button onClick={() => window.location.reload()}>Retry</Button>
              </div>
            ) : courses && courses.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
                {courses.slice(0, 6).map((course: Course, index: number) => (
                  <div key={course._id || Math.random()} className="group relative">
                    <div className="absolute inset-0 bg-gray-200/50 dark:bg-gray-700/50 rounded-3xl transform rotate-1 group-hover:rotate-0 transition-transform duration-500"></div>
                    <div 
                      className="relative bg-white dark:bg-black rounded-3xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 cursor-pointer border border-gray-200 dark:border-gray-800 group-hover:border-gray-400 dark:group-hover:border-gray-600"
                      onClick={() => navigate(`/course/${course.slug}`)}
                    >
                      <div className={`absolute -top-4 -right-4 w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg bg-gray-600 dark:bg-gray-700`}>
                        <Code className="w-8 h-8 text-white" />
                      </div>

                      <div className="relative h-48 w-full overflow-hidden rounded-2xl mb-6">
                        <img 
                          src={course.thumbnail || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNzUgMTI1SDIyNVYxNzVIMTc1VjEyNVoiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTE4NSAxMzVMMjAwIDE1MEwyMTUgMTM1TDIwMCAxMjBMMTg1IDEzNVoiIGZpbGw9IiM2MzY2RjEiLz4KPC9zdmc+'} 
                          alt={course.title} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNzUgMTI1SDIyNVYxNzVIMTc1VjEyNVoiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTE4NSAxMzVMMjAwIDE1MEwyMTUgMTM1TDIwMCAxMjBMMTg1IDEzNVoiIGZpbGw9IiM2MzY2RjEiLz4KPC9zdmc+';
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                          <div className="flex items-center space-x-2 text-white">
                            <Play className="w-4 h-4" />
                            <span className="text-sm font-medium">Start Learning</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-2xl font-bold text-black dark:text-white group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">
                            {course.title}
                          </h3>
                          <div className="flex items-center space-x-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">{course.rating || 4.9}</span>
                          </div>
                        </div>
                        
                        <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
                          {course.description}
                        </p>
                        
                        <div className="flex items-center justify-between pt-4">
                          <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                            <div className="flex items-center space-x-1">
                              <Terminal className="w-4 h-4" />
                              <span>{course.lessonCount || 0} lessons</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Zap className="w-4 h-4" />
                              <span>{course.duration || `${course.lessonCount} lessons`}</span>
                            </div>
                          </div>
                          
                          <Button 
                            size="sm" 
                            className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
                          >
                            <ArrowRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600 dark:text-gray-300 mb-4">No courses available at the moment.</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Check back later for new courses!</p>
              </div>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl md:text-5xl font-black text-black dark:text-white mb-6">
              Ready to Start Learning?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
              Join thousands of developers who are already building amazing projects.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 px-8 py-4 text-lg font-semibold rounded-2xl transition-all duration-300 hover:scale-105"
                onClick={() => navigate('/')}
              >
                Get Started Now
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        </section>
      </main>
      
      <SiteFooter />
    </div>
  );
}