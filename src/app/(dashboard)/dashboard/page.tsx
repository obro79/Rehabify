"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StreakDisplay } from "@/components/ui/streak-display";
import { StatsCard } from "@/components/ui/stats-card";
import { Card } from "@/components/ui/card";
import { ProgressRing } from "@/components/ui/progress-ring";
import { WeeklyCalendar } from "@/components/ui/weekly-calendar";
import { DifficultyStars } from "@/components/ui/difficulty-stars";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  CalendarIcon,
  TimerIcon,
  RepsIcon,
  LibraryIcon,
  GoalIcon,
  GuideIcon,
} from "@/components/ui/icons";
import {
  ArrowRight,
  Play,
} from "lucide-react";
import {
  mockExercises,
  mockSessions,
  mockWeeklyActivity,
  motivationalQuotes,
} from "@/lib/mock-data";
import {
  getCategoryIcon,
  getExerciseIconOrCategory,
  getCategoryBadgeVariant,
  getScoreBadgeVariant,
} from "@/lib/exercise-utils";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/motion";

function getTimeOfDayGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function DashboardPage() {
  const userName = "Sarah";
  const quote = motivationalQuotes[0];
  const greeting = getTimeOfDayGreeting();

  return (
    <div className="max-w-5xl mx-auto space-y-8 relative">
      {/* Organic decorations in corners with breathing animation */}
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-gradient-to-br from-sage-200/20 to-terracotta-200/15 rounded-full blur-3xl animate-sanctuary-breathe pointer-events-none" aria-hidden="true" />
      <div className="absolute top-1/3 -left-20 w-48 h-48 bg-gradient-to-tr from-terracotta-200/15 to-sage-200/20 rounded-full blur-3xl animate-sanctuary-breathe pointer-events-none" style={{ animationDelay: '2s' }} aria-hidden="true" />

      {/* Welcome Section - Full Width Card */}
      <FadeIn>
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sage-100 via-sage-50 to-white p-6 shadow-sm border border-sage-200/50">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-sage-200/30 to-terracotta-100/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 animate-sanctuary-breathe" aria-hidden="true" />
          <div className="relative flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">
                {greeting}, {userName}!
              </h1>
              <p className="text-muted-foreground max-w-md">
                &ldquo;{quote}&rdquo;
              </p>
            </div>
            <div className="bg-white/80 backdrop-blur rounded-3xl p-4 shadow-sm border border-sage-200/50">
              <StreakDisplay currentStreak={5} bestStreak={12} />
            </div>
          </div>
        </section>
      </FadeIn>

      {/* Recommended Exercises - Enhanced Cards */}
      <section className="space-y-4">
        <FadeIn delay={0.1}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Today&apos;s Recommended Exercises
              </h2>
              <p className="text-sm text-muted-foreground">
                Based on your progress and recovery goals
              </p>
            </div>
            <Button variant="primary">
              Start Full Routine
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </FadeIn>

        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {mockExercises.map((exercise) => (
            <StaggerItem key={exercise.name}>
              <Card
                variant="organic"
                className="group p-4 hover:shadow-lg transition-all cursor-pointer hover:scale-[1.02]"
              >
                {/* Icon area */}
                <div className="flex items-center justify-center h-24 bg-sage-50 rounded-2xl mb-3 group-hover:bg-sage-100 transition-colors">
                  {getExerciseIconOrCategory(exercise.id, exercise.category, "md")}
                </div>

                {/* Content */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-foreground">{exercise.name}</h3>
                    <Badge variant={getCategoryBadgeVariant(exercise.category)} size="sm">
                      {exercise.category}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{exercise.duration} • {exercise.reps} reps</span>
                    <DifficultyStars level={exercise.difficulty} />
                  </div>

                  <Button variant="secondary" size="sm" className="w-full mt-2">
                    <Play size={14} className="mr-1" />
                    Start
                  </Button>
                </div>
              </Card>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </section>

      {/* Progress Section - Stats + Visual Elements */}
      <section className="space-y-4">
        <FadeIn>
          <h2 className="text-lg font-semibold text-foreground">This Week</h2>
        </FadeIn>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StaggerItem>
            <StatsCard
              title="Sessions Completed"
              value="4/7"
              customIcon={<CalendarIcon size="sm" variant="sage" />}
              trend={{ direction: "up", value: "+1 from last week" }}
            />
          </StaggerItem>
          <StaggerItem>
            <StatsCard
              title="Total Reps"
              value={120}
              customIcon={<RepsIcon size="sm" variant="sage" />}
              trend={{ direction: "up", value: "+15%" }}
              variant="sage"
            />
          </StaggerItem>
          <StaggerItem>
            <StatsCard
              title="Time Exercising"
              value="45 min"
              customIcon={<TimerIcon size="sm" variant="coral" />}
              variant="coral"
            />
          </StaggerItem>
        </StaggerContainer>

        {/* Form Score + Weekly Calendar Side by Side */}
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Form Score with Progress Ring */}
          <StaggerItem>
            <Card variant="organic" className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Average Form Score</h3>
                <span className="text-sm text-muted-foreground">Last 7 days</span>
              </div>
              <div className="flex items-center gap-6">
                <ProgressRing value={82} size="lg" />
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Your form has improved!
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge variant="success" size="sm">+5%</Badge>
                    <span className="text-sm text-muted-foreground">vs last week</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Focus area: Hip alignment
                  </p>
                </div>
              </div>
            </Card>
          </StaggerItem>

          {/* Weekly Activity Calendar */}
          <StaggerItem>
            <Card variant="organic" className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Weekly Activity</h3>
                <span className="text-sm text-muted-foreground">4 of 7 days</span>
              </div>
              <WeeklyCalendar activities={mockWeeklyActivity} startOfWeek="monday" />
              <p className="text-sm text-muted-foreground mt-4">
                Keep going! Just 3 more days to hit your weekly goal.
              </p>
            </Card>
          </StaggerItem>
        </StaggerContainer>
      </section>

      {/* Recent Sessions - Enhanced Table */}
      <FadeIn>
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Recent Sessions</h2>
            <Button variant="ghost" size="sm">
              View All
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>

          <Card className="overflow-hidden rounded-3xl">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Exercise</TableHead>
                  <TableHead className="text-center">Reps</TableHead>
                  <TableHead className="text-center">Score</TableHead>
                  <TableHead className="text-right">Duration</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockSessions.map((session, i) => (
                  <TableRow key={i} className="cursor-pointer hover:bg-sage-50/50 transition-colors">
                    <TableCell className="text-muted-foreground">{session.date}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-sage-50 rounded-lg">
                          {getCategoryIcon(session.category, "sm")}
                        </div>
                        <span className="font-medium">{session.exercise}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">{session.reps}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={getScoreBadgeVariant(session.score)} size="sm">
                        {session.score}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">{session.duration}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </section>
      </FadeIn>

      {/* Quick Actions - Better Visual Design */}
      <section className="space-y-4">
        <FadeIn>
          <h2 className="text-lg font-semibold text-foreground">Quick Actions</h2>
        </FadeIn>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StaggerItem>
            <Card
              className="group p-5 cursor-pointer hover:shadow-md transition-all hover:scale-[1.02] border-sage-200/50 focus:outline-none focus:ring-2 focus:ring-sage-400 focus:ring-offset-2 rounded-3xl"
              tabIndex={0}
              role="button"
              aria-label="Exercise Library - Browse all 52 exercises"
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  // Navigate to exercise library
                }
              }}
            >
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-xl">
                  <LibraryIcon size="md" variant="sage" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Exercise Library</h3>
                  <p className="text-sm text-muted-foreground">Browse all 52 exercises</p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" aria-hidden="true" />
              </div>
            </Card>
          </StaggerItem>

          <StaggerItem>
            <Card
              className="group p-5 cursor-pointer hover:shadow-md transition-all hover:scale-[1.02] border-sage-200/50 focus:outline-none focus:ring-2 focus:ring-sage-400 focus:ring-offset-2 rounded-3xl"
              tabIndex={0}
              role="button"
              aria-label="Set Daily Goal - Configure your targets"
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  // Navigate to set daily goal
                }
              }}
            >
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-xl">
                  <GoalIcon size="md" variant="coral" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Set Daily Goal</h3>
                  <p className="text-sm text-muted-foreground">Configure your targets</p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" aria-hidden="true" />
              </div>
            </Card>
          </StaggerItem>

          <StaggerItem>
            <Card
              className="group p-5 cursor-pointer hover:shadow-md transition-all hover:scale-[1.02] border-sage-200/50 focus:outline-none focus:ring-2 focus:ring-sage-400 focus:ring-offset-2 rounded-3xl"
              tabIndex={0}
              role="button"
              aria-label="How-To Guides - Learn proper form"
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  // Navigate to how-to guides
                }
              }}
            >
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-xl">
                  <GuideIcon size="md" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">How-To Guides</h3>
                  <p className="text-sm text-muted-foreground">Learn proper form</p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" aria-hidden="true" />
              </div>
            </Card>
          </StaggerItem>
        </StaggerContainer>
      </section>
    </div>
  );
}
