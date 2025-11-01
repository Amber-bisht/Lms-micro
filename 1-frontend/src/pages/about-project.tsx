import { useEffect, useRef, useState } from "react";
import { useTheme } from "@/components/theme-provider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import MainLayout from "@/components/layout/main-layout";
import mermaid from "mermaid";
import {
  Server,
  Database,
  Cloud,
  Code,
  Layers,
  Lock,
  Zap,
  GitBranch,
  Youtube,
  Upload,
  MessageSquare,
  Settings,
  Shield,
} from "lucide-react";

const architectureDiagram = `graph TB
    subgraph "Client Layer"
        FE[React Frontend<br/>Port 5173<br/>- Auth UI<br/>- Video Player<br/>- Course Browser<br/>- Admin Dashboard]
    end

    subgraph "API Gateway Layer"
        GW[API Gateway<br/>Port 3000<br/>- Routing<br/>- CORS<br/>- Rate Limiting<br/>- Health Checks]
    end

    subgraph "Microservices Layer"
        AUTH[Auth Service<br/>Port 3001<br/>- OAuth Google/GitHub<br/>- JWT/Sessions<br/>- User Management<br/>- Passport.js]
        
        COURSE[Course Service<br/>Port 3004<br/>- Courses CRUD<br/>- Enrollment<br/>- Progress Tracking<br/>- Lessons]
        
        UPLOAD[Uploader Service<br/>Port 3005<br/>- File Upload<br/>- Video Queue<br/>- FFmpeg Processing<br/>- HLS Conversion]
        
        MEDIA[Media Service<br/>Port 3008<br/>- YouTube API<br/>- Dailymotion<br/>- Video Search<br/>- Metadata]
        
        COMMUNITY[Community Service<br/>Port 3009<br/>- Comments<br/>- Reviews<br/>- Ratings<br/>- Discussions]
        
        ADMIN[Admin Service<br/>Port 3010<br/>- Analytics<br/>- User Management<br/>- Moderation<br/>- Cache Control]
    end

    subgraph "Data Layer"
        MONGO[(MongoDB<br/>Port 27017<br/>- lms-auth<br/>- lms-courses<br/>- lms-uploader<br/>- lms-community)]
        
        REDIS[(Redis<br/>Port 6379<br/>- Sessions<br/>- Bull Queue<br/>- Rate Limits<br/>- Cache)]
    end

    subgraph "Processing Layer"
        QUEUE[Bull Queue<br/>Redis-based<br/>- Video Jobs<br/>- Job Status<br/>- Retries]
        
        FFMPEG[FFmpeg<br/>- Transcode 720p<br/>- Transcode 1080p<br/>- Generate HLS<br/>- Create Thumbnails]
        
        HLS[HLS Output<br/>- .m3u8 Playlists<br/>- .ts Segments<br/>- Adaptive Bitrate<br/>- Thumbnails]
    end

    subgraph "Storage Layer"
        S3[AWS S3 / CDN<br/>- Video Storage<br/>- HLS Segments<br/>- Thumbnails<br/>- Presigned URLs]
        
        LOCAL[Local Storage<br/>- /uploads<br/>- Development<br/>- File Serving]
    end

    subgraph "External Services"
        YT[YouTube API<br/>- Video Search<br/>- Metadata<br/>- Thumbnails<br/>- Statistics]
        
        OAUTH[OAuth Providers<br/>- Google OAuth<br/>- GitHub OAuth<br/>- User Info<br/>- Profiles]
        
        DM[Dailymotion API<br/>- Video Search<br/>- Metadata<br/>- Embeds]
    end

    %% Client to Gateway
    FE -->|HTTP/HTTPS<br/>Cookies| GW

    %% Gateway to Services
    GW -->|/api/auth| AUTH
    GW -->|/api/courses| COURSE
    GW -->|/api/upload<br/>/api/videos| UPLOAD
    GW -->|/api/media| MEDIA
    GW -->|/api/comments<br/>/api/reviews| COMMUNITY
    GW -->|/api/admin| ADMIN

    %% Services to Data Layer
    AUTH -->|Read/Write| MONGO
    AUTH -->|Sessions| REDIS
    
    COURSE -->|Read/Write| MONGO
    
    UPLOAD -->|Read/Write| MONGO
    UPLOAD -->|Jobs| REDIS
    
    COMMUNITY -->|Read/Write| MONGO
    
    ADMIN -->|Cache| REDIS

    %% Video Processing Flow
    UPLOAD -->|Queue Job| QUEUE
    QUEUE -->|Process| FFMPEG
    FFMPEG -->|Output| HLS
    HLS -->|Upload| S3
    HLS -->|Store| LOCAL

    %% External Service Connections
    AUTH -->|OAuth| OAUTH
    MEDIA -->|API Calls| YT
    MEDIA -->|API Calls| DM

    %% Service to Service Communication
    COURSE -.->|Verify User| AUTH
    UPLOAD -.->|Course Info| COURSE
    COMMUNITY -.->|Course Exists| COURSE

    %% Styling
    classDef frontend fill:#61dafb,stroke:#333,stroke-width:2px,color:#000
    classDef gateway fill:#ff6b6b,stroke:#333,stroke-width:2px,color:#fff
    classDef service fill:#4ecdc4,stroke:#333,stroke-width:2px,color:#000
    classDef data fill:#95e1d3,stroke:#333,stroke-width:2px,color:#000
    classDef processing fill:#feca57,stroke:#333,stroke-width:2px,color:#000
    classDef storage fill:#48dbfb,stroke:#333,stroke-width:2px,color:#000
    classDef external fill:#a29bfe,stroke:#333,stroke-width:2px,color:#000

    class FE frontend
    class GW gateway
    class AUTH,COURSE,UPLOAD,MEDIA,COMMUNITY,ADMIN service
    class MONGO,REDIS data
    class QUEUE,FFMPEG,HLS processing
    class S3,LOCAL storage
    class YT,OAUTH,DM external`;

const AboutProject = () => {
  const { theme } = useTheme();
  const mermaidRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const renderDiagram = async () => {
      if (!mermaidRef.current) return;

      setIsLoading(true);

      try {
        mermaid.initialize({
          startOnLoad: false,
          theme: theme === "dark" ? "dark" : "default",
          securityLevel: "strict",
          fontFamily: "inherit",
          fontSize: 14,
        });

        const { svg } = await mermaid.render(
          `architecture-diagram-${Date.now()}`,
          architectureDiagram
        );

        if (isMounted && mermaidRef.current) {
          mermaidRef.current.innerHTML = svg;
        }
      } catch (error) {
        console.error("Mermaid rendering error:", error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    renderDiagram();

    return () => {
      isMounted = false;
    };
  }, [theme]);

  const technologies = [
    { name: "React 18", icon: Code, color: "bg-blue-500" },
    { name: "TypeScript", icon: Code, color: "bg-blue-600" },
    { name: "Express.js", icon: Server, color: "bg-green-500" },
    { name: "MongoDB", icon: Database, color: "bg-green-600" },
    { name: "Redis", icon: Database, color: "bg-red-500" },
    { name: "FFmpeg", icon: Upload, color: "bg-orange-500" },
    { name: "AWS S3", icon: Cloud, color: "bg-yellow-500" },
    { name: "Docker", icon: Layers, color: "bg-cyan-500" },
  ];

  const features = [
    {
      icon: Lock,
      title: "Secure Authentication",
      description: "OAuth 2.0 with Google & GitHub, JWT tokens, and Redis sessions",
    },
    {
      icon: Upload,
      title: "Video Processing",
      description: "FFmpeg-powered HLS conversion with 720p & 1080p adaptive streaming",
    },
    {
      icon: Youtube,
      title: "YouTube Integration",
      description: "Seamless integration with YouTube API for video metadata and search",
    },
    {
      icon: MessageSquare,
      title: "Community Features",
      description: "Comments, reviews, and ratings for courses and content",
    },
    {
      icon: Zap,
      title: "Real-time Processing",
      description: "Bull queue with Redis for asynchronous video processing",
    },
    {
      icon: Shield,
      title: "Admin Dashboard",
      description: "Comprehensive admin panel for user and content management",
    },
  ];

  const services = [
    { name: "API Gateway", port: 3000, icon: GitBranch },
    { name: "Auth Service", port: 3001, icon: Lock },
    { name: "Course Service", port: 3004, icon: Code },
    { name: "Uploader Service", port: 3005, icon: Upload },
    { name: "Media Service", port: 3008, icon: Youtube },
    { name: "Community Service", port: 3009, icon: MessageSquare },
    { name: "Admin Service", port: 3010, icon: Settings },
  ];

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            LMS Microservices Architecture
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            A production-ready Learning Management System built with modern microservices architecture,
            featuring video streaming, course management, and robust authentication.
          </p>
        </div>

        {/* Technologies */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-5 w-5" />
              Technology Stack
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {technologies.map((tech) => (
                <Badge key={tech.name} variant="secondary" className="px-4 py-2">
                  <tech.icon className="h-4 w-4 mr-2" />
                  {tech.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Architecture Diagram */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>System Architecture Diagram</CardTitle>
            <CardDescription>
              Visual representation of the microservices architecture showing all services, data flows, and integrations
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading && (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            )}
            <div 
              ref={mermaidRef} 
              className={`mermaid ${isLoading ? "hidden" : ""} overflow-x-auto`}
            />
          </CardContent>
        </Card>

        {/* Services Grid */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Microservices</CardTitle>
            <CardDescription>
              Independent services working together to provide a scalable and maintainable system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.map((service) => (
                <div
                  key={service.name}
                  className="flex items-center gap-3 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <service.icon className="h-8 w-8 text-primary" />
                  <div>
                    <h3 className="font-semibold">{service.name}</h3>
                    <p className="text-sm text-muted-foreground">Port: {service.port}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Key Features */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Key Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature) => (
                <div key={feature.title} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <feature.icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="font-semibold">{feature.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Architecture Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Data Layer
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h4 className="font-semibold mb-2">MongoDB (Port 27017)</h4>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>lms-auth - User accounts & profiles</li>
                  <li>lms-courses - Courses & lessons</li>
                  <li>lms-uploader - Video metadata</li>
                  <li>lms-community - Comments & reviews</li>
                </ul>
              </div>
              <Separator />
              <div>
                <h4 className="font-semibold mb-2">Redis (Port 6379)</h4>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Session store for authentication</li>
                  <li>Bull queue for video processing</li>
                  <li>Rate limiting & caching</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Video Processing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h4 className="font-semibold mb-2">FFmpeg Pipeline</h4>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>H.264 video codec with AAC audio</li>
                  <li>720p @ 2Mbps & 1080p @ 4Mbps</li>
                  <li>HLS with 2-second segments</li>
                  <li>Automatic thumbnail generation</li>
                </ul>
              </div>
              <Separator />
              <div>
                <h4 className="font-semibold mb-2">Storage Options</h4>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Local storage for development</li>
                  <li>AWS S3 for production</li>
                  <li>CDN integration support</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Security & Performance */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Features
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
                <li>OAuth 2.0 (Google, GitHub)</li>
                <li>JWT token authentication</li>
                <li>Redis session management</li>
                <li>Password hashing with bcrypt</li>
                <li>Rate limiting & IP tracking</li>
                <li>CORS configuration</li>
                <li>Role-based access control</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
                <li>Adaptive bitrate streaming (HLS)</li>
                <li>Redis caching layer</li>
                <li>Database query optimization</li>
                <li>CDN distribution</li>
                <li>Asynchronous processing</li>
                <li>Connection pooling</li>
                <li>Response compression</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">
                This system is designed for horizontal scaling, with each service independently deployable and maintainable.
              </p>
              <div className="flex items-center justify-center gap-4">
                <Badge variant="outline">Version 1.0.0</Badge>
                <Badge variant="outline">Production Ready</Badge>
                <Badge variant="outline">Dockerized</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default AboutProject;

