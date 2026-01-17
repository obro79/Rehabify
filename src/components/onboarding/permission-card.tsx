"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle, Loader2, XCircle } from "lucide-react";
import { CameraIcon, MicrophoneIcon } from "@/components/ui/icons";

export type PermissionType = "camera" | "microphone";
export type PermissionStatus = "pending" | "granted" | "denied" | "unavailable";

export interface PermissionCardProps {
  type: PermissionType;
  onGranted?: () => void;
  onSkip?: () => void;
}

const PERMISSION_CONFIG = {
  camera: {
    Icon: CameraIcon,
    title: "Camera Access",
    description: "We'll use your camera to analyze your exercise form in real-time",
    constraint: { video: true },
  },
  microphone: {
    Icon: MicrophoneIcon,
    title: "Microphone Access",
    description: "Enable voice coaching for hands-free guidance during your workout",
    constraint: { audio: true },
  },
} as const;

const PermissionCard = React.forwardRef<HTMLDivElement, PermissionCardProps>(
  ({ type, onGranted, onSkip }, ref) => {
    const [status, setStatus] = React.useState<PermissionStatus>("pending");
    const config = PERMISSION_CONFIG[type];
    const Icon = config.Icon;
    const requestedRef = React.useRef(false);

    // Auto-request permission on mount
    React.useEffect(() => {
      if (requestedRef.current) return;
      requestedRef.current = true;

      const requestPermission = async () => {
        // Check if getUserMedia is available
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setStatus("unavailable");
          return;
        }

        try {
          // Request permission
          const stream = await navigator.mediaDevices.getUserMedia(config.constraint);

          // Stop all tracks immediately (we just needed permission)
          stream.getTracks().forEach(track => track.stop());

          setStatus("granted");

          // Auto-advance after delay
          setTimeout(() => {
            onGranted?.();
          }, 1500);
        } catch (error) {
          console.error(`Permission denied for ${type}:`, error);
          setStatus("denied");
        }
      };

      requestPermission();
    }, [type, config.constraint, onGranted]);

    const handleRetry = async () => {
      setStatus("pending");

      try {
        const stream = await navigator.mediaDevices.getUserMedia(config.constraint);
        stream.getTracks().forEach(track => track.stop());
        setStatus("granted");

        setTimeout(() => {
          onGranted?.();
        }, 1500);
      } catch (error) {
        console.error(`Permission denied for ${type}:`, error);
        setStatus("denied");
      }
    };

    return (
      <Card ref={ref} className="surface-organic border-2 border-sage-200/60">
        <CardContent className="p-8 flex flex-col items-center text-center space-y-6">
          {/* Status Icon */}
          <div className="relative">
            {status === "pending" && (
              <div className="flex items-center justify-center w-20 h-20 rounded-full bg-sage-100/50">
                <Icon size="lg" variant="sage" />
                <Loader2 className="absolute -bottom-1 -right-1 w-5 h-5 text-sage-500 animate-spin" />
              </div>
            )}
            {status === "granted" && (
              <div className="relative motion-safe:animate-in motion-safe:zoom-in-75 motion-safe:duration-300">
                <div className="flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100/50">
                  <Icon size="lg" variant="sage" />
                </div>
                <CheckCircle2 className="absolute -bottom-1 -right-1 w-6 h-6 text-emerald-500 fill-white" />
              </div>
            )}
            {status === "denied" && (
              <div className="relative">
                <div className="flex items-center justify-center w-20 h-20 rounded-full bg-amber-100/50">
                  <Icon size="lg" variant="coral" />
                </div>
                <AlertCircle className="absolute -bottom-1 -right-1 w-6 h-6 text-amber-500 fill-white" />
              </div>
            )}
            {status === "unavailable" && (
              <div className="relative">
                <div className="flex items-center justify-center w-20 h-20 rounded-full bg-gray-100/50">
                  <Icon size="lg" variant="sage" className="opacity-50" />
                </div>
                <XCircle className="absolute -bottom-1 -right-1 w-6 h-6 text-gray-400 fill-white" />
              </div>
            )}
          </div>

          {/* Title & Description */}
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-foreground">
              {config.title}
            </h3>
            <p className="text-sm text-muted-foreground max-w-md">
              {config.description}
            </p>
          </div>

          {/* Status Messages & Actions */}
          {status === "pending" && (
            <p className="text-sm text-sage-600 font-medium">
              Requesting permission...
            </p>
          )}

          {status === "granted" && (
            <div className="space-y-3">
              <p className="text-sm text-emerald-600 font-medium" role="status">
                Permission granted!
              </p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onGranted?.()}
              >
                Continue
              </Button>
            </div>
          )}

          {status === "denied" && (
            <div className="space-y-4">
              <p className="text-sm text-amber-600 font-medium" role="alert">
                Permission was denied. You can continue without this feature or try again.
              </p>
              <div className="flex gap-3 justify-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onSkip}
                >
                  Skip for now
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleRetry}
                >
                  Try Again
                </Button>
              </div>
            </div>
          )}

          {status === "unavailable" && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600" role="alert">
                This feature is not available in your browser. You can continue with limited functionality.
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={onSkip}
              >
                Continue
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }
);

PermissionCard.displayName = "PermissionCard";

export { PermissionCard };
