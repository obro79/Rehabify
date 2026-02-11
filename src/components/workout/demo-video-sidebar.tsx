"use client";

import React from "react";
import { Card } from "@/components/ui/card";

interface DemoVideoSidebarProps {
  videoUrl: string;
  exerciseName: string;
}

export function DemoVideoSidebar({
  videoUrl,
  exerciseName,
}: DemoVideoSidebarProps): React.JSX.Element {
  return (
    <div className="hidden lg:block">
      <Card className="overflow-hidden shadow-lg sticky top-20">
        <div className="aspect-[3/4] bg-black relative">
          <video
            src={videoUrl}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          />
          <div className="absolute top-3 left-3">
            <span className="px-2 py-1 bg-white/90 backdrop-blur-sm rounded-full text-xs font-semibold text-sage-700">
              Demo
            </span>
          </div>
        </div>
        <div className="p-3 bg-white">
          <p className="text-sm font-medium text-sage-800">{exerciseName}</p>
          <p className="text-xs text-muted-foreground mt-1">Follow along with the video</p>
        </div>
      </Card>
    </div>
  );
}
