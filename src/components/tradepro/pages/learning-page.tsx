'use client'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  GraduationCap,
  BookOpen,
  Target,
  ShieldCheck,
  BarChart3,
  CandlestickChart,
  ArrowRight,
  Play,
  Clock,
  Star,
  FileText,
  Video,
  Lightbulb,
  ChevronRight,
  Sparkles,
} from 'lucide-react'

// ─── Mock Data ────────────────────────────────────────────────────────────────

const learningPaths = [
  {
    id: 1,
    title: 'Beginner Trading',
    description: 'Master the fundamentals of trading, market structure, and order types.',
    modules: 8,
    completed: 5,
    progress: 60,
    accentBg: 'bg-emerald-500/10',
    accentText: 'text-emerald-500',
    accentBorder: 'border-emerald-500',
    accentColor: '#10b981',
    icon: BookOpen,
    buttonLabel: 'Continue',
  },
  {
    id: 2,
    title: 'Technical Analysis',
    description: 'Learn chart patterns, indicators, and technical trading strategies.',
    modules: 12,
    completed: 3,
    progress: 25,
    accentBg: 'bg-amber-500/10',
    accentText: 'text-amber-500',
    accentBorder: 'border-amber-500',
    accentColor: '#f59e0b',
    icon: CandlestickChart,
    buttonLabel: 'Continue',
  },
  {
    id: 3,
    title: 'Risk Management',
    description: 'Understand position sizing, stop-loss strategies, and portfolio protection.',
    modules: 6,
    completed: 0,
    progress: 0,
    accentBg: 'bg-red-500/10',
    accentText: 'text-red-500',
    accentBorder: 'border-red-500',
    accentColor: '#ef4444',
    icon: ShieldCheck,
    buttonLabel: 'Start',
  },
]

const featuredCourses = [
  {
    id: 1,
    title: 'Candlestick Patterns Mastery',
    duration: '4h 30min',
    difficulty: 'Intermediate',
    rating: 4.8,
    totalRatings: 342,
    accentColor: '#f59e0b',
    headerGradient: 'from-amber-500 to-amber-500/70',
    icon: CandlestickChart,
    progress: 35,
    started: true,
  },
  {
    id: 2,
    title: 'Moving Averages Deep Dive',
    duration: '3h 15min',
    difficulty: 'Beginner',
    rating: 4.6,
    totalRatings: 218,
    accentColor: '#10b981',
    headerGradient: 'from-emerald-500 to-emerald-500/70',
    icon: BarChart3,
    progress: 0,
    started: false,
  },
  {
    id: 3,
    title: 'Options Trading 101',
    duration: '6h 45min',
    difficulty: 'Advanced',
    rating: 4.9,
    totalRatings: 156,
    accentColor: '#ef4444',
    headerGradient: 'from-red-500 to-red-500/70',
    icon: Target,
    progress: 0,
    started: false,
  },
  {
    id: 4,
    title: 'Crypto Market Dynamics',
    duration: '5h 20min',
    difficulty: 'Intermediate',
    rating: 4.7,
    totalRatings: 289,
    accentColor: '#f59e0b',
    headerGradient: 'from-amber-500 via-amber-500/80 to-emerald-500',
    icon: Sparkles,
    progress: 12,
    started: true,
  },
]

const recentActivity = [
  {
    id: 1,
    title: 'Support & Resistance Levels',
    course: 'Technical Analysis',
    progress: 65,
    timeAgo: '2 hours ago',
    accentText: 'text-amber-500',
  },
  {
    id: 2,
    title: 'Order Types & Execution',
    course: 'Beginner Trading',
    progress: 80,
    timeAgo: 'Yesterday',
    accentText: 'text-emerald-500',
  },
  {
    id: 3,
    title: 'Candlestick Reversal Patterns',
    course: 'Candlestick Patterns Mastery',
    progress: 45,
    timeAgo: '2 days ago',
    accentText: 'text-amber-500',
  },
]

const resources = [
  {
    id: 1,
    title: 'Market Glossary',
    description: '500+ trading terms explained',
    icon: BookOpen,
    accentBg: 'bg-amber-500/10',
    accentText: 'text-amber-500',
  },
  {
    id: 2,
    title: 'Strategy Templates',
    description: 'Ready-to-use trading plans',
    icon: FileText,
    accentBg: 'bg-emerald-500/10',
    accentText: 'text-emerald-500',
  },
  {
    id: 3,
    title: 'Video Tutorials',
    description: '100+ hours of expert content',
    icon: Video,
    accentBg: 'bg-red-500/10',
    accentText: 'text-red-500',
  },
]

// ─── Star Rating Component ────────────────────────────────────────────────────

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`size-3.5 ${
            i < Math.floor(rating)
              ? 'text-yellow-400 fill-yellow-400'
              : i < rating
                ? 'text-yellow-400 fill-yellow-400/50'
                : 'text-gray-600'
          }`}
        />
      ))}
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function LearningPage() {
  const totalModules = 48
  const completedModules = 12

  return (
    <div className="min-h-screen bg-[#0a0e17] p-4 sm:p-6 lg:p-8 space-y-6">
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2">
            <GraduationCap className="size-7 text-amber-500" />
            Learning Hub
          </h1>
          <p className="text-gray-400 mt-1 text-sm">
            Build your trading knowledge with structured courses and resources
          </p>
        </div>
        <Badge
          variant="secondary"
          className="bg-amber-500/10 text-amber-500 border-0 text-sm font-semibold px-4 py-2 self-start sm:self-auto gap-1.5"
        >
          <BookOpen className="size-4" />
          {completedModules} of {totalModules} modules completed
        </Badge>
      </div>

      {/* Overall Progress Bar */}
      <Card className="bg-[#111827] border border-[#1f2937] rounded-xl shadow-sm">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-white">Overall Progress</span>
            <span className="font-mono text-sm font-bold text-amber-500">
              {Math.round((completedModules / totalModules) * 100)}%
            </span>
          </div>
          <Progress
            value={(completedModules / totalModules) * 100}
            className="h-3 bg-[#1f2937]"
          />
          <p className="text-xs text-gray-400 mt-2">
            Complete {totalModules - completedModules} more modules to finish all paths
          </p>
        </CardContent>
      </Card>

      {/* ── Learning Paths ──────────────────────────────────────────────── */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Lightbulb className="size-5 text-amber-500" />
          Learning Paths
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
          {learningPaths.map((path) => {
            const Icon = path.icon
            return (
              <Card
                key={path.id}
                className={`bg-[#111827] border border-[#1f2937] rounded-xl shadow-sm hover:shadow-md transition-shadow border-l-4 ${path.accentBorder}`}
              >
                <CardContent className="p-5 sm:p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`size-10 rounded-xl ${path.accentBg} flex items-center justify-center`}>
                      <Icon className={`size-5 ${path.accentText}`} />
                    </div>
                    <Badge
                      variant="secondary"
                      className="bg-[#1f2937] text-gray-400 border-0 text-xs"
                    >
                      {path.modules} modules
                    </Badge>
                  </div>

                  <h3 className="text-base font-bold text-white mb-1">
                    {path.title}
                  </h3>
                  <p className="text-sm text-gray-400 mb-4 leading-relaxed">
                    {path.description}
                  </p>

                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs font-medium text-gray-400">
                        {path.completed}/{path.modules} completed
                      </span>
                      <span className="text-xs font-bold text-white">
                        {path.progress}%
                      </span>
                    </div>
                    <Progress value={path.progress} className="h-2" />
                  </div>

                  <Button
                    size="sm"
                    className={`w-full gap-1.5 spring-interaction ${
                      path.progress === 0
                        ? `bg-[${path.accentColor}] hover:bg-[${path.accentColor}]/90`
                        : ''
                    }`}
                    variant={path.progress === 0 ? 'default' : 'default'}
                  >
                    {path.buttonLabel}
                    <ArrowRight className="size-3.5" />
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      {/* ── Featured Courses ────────────────────────────────────────────── */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <CandlestickChart className="size-5 text-gray-400" />
          Featured Courses
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {featuredCourses.map((course) => {
            const Icon = course.icon
            return (
              <Card
                key={course.id}
                className="bg-[#111827] border border-[#1f2937] rounded-xl shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 overflow-hidden"
              >
                {/* Colored Header */}
                <div className={`h-24 bg-gradient-to-br ${course.headerGradient} relative flex items-center justify-center`}>
                  <Icon className="size-10 text-white/80" />
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-white/20 text-white border-0 text-[10px] font-semibold backdrop-blur-sm">
                      {course.difficulty}
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-bold text-white text-sm mb-2 line-clamp-2">
                    {course.title}
                  </h3>
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="size-3.5 text-gray-400" />
                    <span className="text-xs text-gray-400">{course.duration}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <StarRating rating={course.rating} />
                    <span className="text-xs font-medium text-white">
                      {course.rating}
                    </span>
                    <span className="text-xs text-gray-400">
                      ({course.totalRatings})
                    </span>
                  </div>

                  {course.started && course.progress > 0 && (
                    <div className="mb-3">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] text-gray-400">Progress</span>
                        <span className="text-[10px] font-bold text-white">
                          {course.progress}%
                        </span>
                      </div>
                      <Progress value={course.progress} className="h-1.5" />
                    </div>
                  )}

                  <Button
                    size="sm"
                    variant={course.started ? 'default' : 'outline'}
                    className={`w-full gap-1.5 spring-interaction text-xs ${
                      course.started
                        ? ''
                        : 'border-amber-500/30 text-amber-500 hover:bg-amber-500/10'
                    }`}
                  >
                    {course.started ? (
                      <>
                        <Play className="size-3" />
                        Continue
                      </>
                    ) : (
                      <>
                        Start Course
                        <ArrowRight className="size-3" />
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>

      {/* ── Recent Activity ─────────────────────────────────────────────── */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Clock className="size-5 text-gray-400" />
          Recent Activity
        </h2>
        <Card className="bg-[#111827] border border-[#1f2937] rounded-xl shadow-sm">
          <CardContent className="p-0">
            <div className="divide-y divide-[#1f2937]">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center gap-4 p-4 hover:bg-[#1f2937]/50 transition-colors"
                >
                  <div className="size-10 rounded-xl bg-[#1f2937] flex items-center justify-center shrink-0">
                    <Play className={`size-4 ${activity.accentText}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm text-white truncate">
                      {activity.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-400">
                        {activity.course}
                      </span>
                      <span className="text-gray-600">·</span>
                      <span className="text-xs text-gray-400">
                        {activity.timeAgo}
                      </span>
                    </div>
                    <div className="mt-1.5">
                      <Progress value={activity.progress} className="h-1.5 max-w-[200px]" />
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`gap-1 ${activity.accentText} shrink-0 spring-interaction`}
                  >
                    Resume
                    <ChevronRight className="size-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* ── Resources ───────────────────────────────────────────────────── */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <FileText className="size-5 text-gray-400" />
          Resources
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {resources.map((resource) => {
            const Icon = resource.icon
            return (
              <Card
                key={resource.id}
                className="bg-[#111827] border border-[#1f2937] rounded-xl shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 group cursor-pointer"
              >
                <CardContent className="p-5 flex items-start gap-4">
                  <div
                    className={`size-11 rounded-xl ${resource.accentBg} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}
                  >
                    <Icon className={`size-5 ${resource.accentText}`} />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-white text-sm mb-0.5">
                      {resource.title}
                    </h3>
                    <p className="text-xs text-gray-400">
                      {resource.description}
                    </p>
                    <Button
                      variant="link"
                      size="sm"
                      className={`gap-1 ${resource.accentText} px-0 mt-1 h-auto py-0 text-xs font-semibold`}
                    >
                      Explore
                      <ArrowRight className="size-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </section>
    </div>
  )
}
