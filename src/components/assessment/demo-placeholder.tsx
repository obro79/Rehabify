"use client";

export function ExerciseDemoPlaceholder(): React.ReactElement {
  return (
    <div className="h-full flex items-center justify-center bg-gradient-to-br from-sage-50 to-sage-100">
      <div className="text-center p-8">
        <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-sage-200/50 flex items-center justify-center">
          <svg viewBox="0 0 24 24" className="w-12 h-12 text-sage-400" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="5" r="3" />
            <line x1="12" y1="8" x2="12" y2="16" />
            <line x1="12" y1="12" x2="8" y2="10" />
            <line x1="12" y1="12" x2="16" y2="10" />
            <line x1="12" y1="16" x2="9" y2="21" />
            <line x1="12" y1="16" x2="15" y2="21" />
          </svg>
        </div>
        <p className="text-sm font-medium text-sage-600 mb-1">Exercise Demo</p>
        <p className="text-xs text-sage-500">Movement tests will appear here</p>
      </div>
    </div>
  );
}
