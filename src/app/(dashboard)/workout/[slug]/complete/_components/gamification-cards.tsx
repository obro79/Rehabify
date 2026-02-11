"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { StreakDisplay } from "@/components/ui/streak-display";
import { TrophyIcon } from "@/components/ui/icons";

interface GamificationCardProps {
  animationDelay: string;
  children: React.ReactNode;
  title?: React.ReactNode;
}

function GamificationCard({
  animationDelay,
  children,
  title,
}: GamificationCardProps): React.ReactElement {
  return (
    <Card
      className="surface-organic animate-celebration-fade-in-up [animation-delay:var(--delay)]"
      style={{ "--delay": animationDelay } as React.CSSProperties}
    >
      {title && (
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
      )}
      {children}
    </Card>
  );
}

interface XPCardProps {
  xpEarned: number;
  currentLevel: number;
  currentXP: number;
  nextLevelXP: number;
  levelProgress: number;
  animationDelay: string;
}

export function XPCard({
  xpEarned,
  currentLevel,
  currentXP,
  nextLevelXP,
  levelProgress,
  animationDelay,
}: XPCardProps): React.ReactElement {
  const xpTitle = (
    <span className="flex items-center gap-2">
      <TrophyIcon size="sm" variant="sage" />
      XP Earned
    </span>
  );

  return (
    <GamificationCard animationDelay={animationDelay} title={xpTitle}>
      <CardContent className="space-y-4">
        <div className="text-center">
          <div className="text-4xl font-bold text-sage-600">+{xpEarned} XP</div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Level {currentLevel}</span>
            <span className="font-medium text-foreground">
              {currentXP} / {nextLevelXP} XP
            </span>
          </div>
          <Progress value={currentXP} max={nextLevelXP} size="lg" color="sage" />
          <div className="text-center text-xs text-muted-foreground">
            {levelProgress}% to Level {currentLevel + 1}
          </div>
        </div>
      </CardContent>
    </GamificationCard>
  );
}

interface StreakCardProps {
  currentStreak: number;
  bestStreak: number;
  animationDelay: string;
}

export function StreakCard({
  currentStreak,
  bestStreak,
  animationDelay,
}: StreakCardProps): React.ReactElement {
  return (
    <GamificationCard animationDelay={animationDelay} title="Streak">
      <CardContent className="flex items-center justify-center py-4">
        <StreakDisplay
          currentStreak={currentStreak}
          bestStreak={bestStreak}
          size="lg"
        />
      </CardContent>
    </GamificationCard>
  );
}
