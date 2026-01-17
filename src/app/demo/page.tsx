"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ProgressRing } from "@/components/ui/progress-ring";
import { ExerciseCard } from "@/components/ui/exercise-card";
import { Avatar } from "@/components/ui/avatar";
import { SidebarNav } from "@/components/ui/sidebar-nav";
import { SearchBar } from "@/components/ui/search-bar";
import { Calendar } from "@/components/ui/calendar";
import {
  CalendarIcon,
  SpineIcon,
  PoseIcon,
  MicrophoneIcon,
  TrophyIcon,
  CameraIcon,
  TimerIcon,
  MobilityIcon,
  StabilityIcon,
  StrengthIcon,
  StretchIcon,
} from "@/components/ui/icons";
import { VoiceIndicator } from "@/components/ui/voice-indicator";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { RepCounter } from "@/components/ui/rep-counter";
import { SessionTimer } from "@/components/ui/session-timer";
import { StatsCard } from "@/components/ui/stats-card";
import { StreakDisplay } from "@/components/ui/streak-display";
import { WeeklyCalendar } from "@/components/ui/weekly-calendar";
import { EmptyState } from "@/components/ui/empty-state";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Logo } from "@/components/ui/logo";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { SessionControls } from "@/components/ui/session-controls";
import { Progress } from "@/components/ui/progress";
import { Tooltip } from "@/components/ui/tooltip";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Collapsible, CollapsibleTrigger, CollapsibleContent, Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/collapsible";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { NumberInput } from "@/components/ui/number-input";
import { Pagination } from "@/components/ui/pagination";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { DatePicker } from "@/components/ui/date-picker";
import { Character, CharacterPose } from "@/components/3d";
import { ArrowRight, Play, Pause, Search, Repeat, Clock, Target, History, Menu, Settings, Info, Folder } from "lucide-react";

export default function DemoPage() {
  const [switchChecked, setSwitchChecked] = useState(false);
  const [repCount, setRepCount] = useState(5);
  const [selectValue, setSelectValue] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [sliderValue, setSliderValue] = useState(50);
  const [checkboxChecked, setCheckboxChecked] = useState(false);
  const [radioValue, setRadioValue] = useState("easy");
  const [toggleValue, setToggleValue] = useState("mobility");
  const [numberValue, setNumberValue] = useState(5);
  const [currentPage, setCurrentPage] = useState(3);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [collapsibleOpen, setCollapsibleOpen] = useState(false);
  const [characterPose, setCharacterPose] = useState<CharacterPose>("idle");
  const sessionStart = new Date(Date.now() - 125000); // 2:05 ago

  return (
    <div className="min-h-screen p-8 flex gap-8">
      {/* Sidebar */}
      <SidebarNav activeHref="/dashboard" />

      <div className="max-w-5xl space-y-8 flex-1">
        {/* Logo */}
        <div className="flex items-center justify-between">
          <Logo size="lg" />
          <div className="flex items-center gap-4">
            <Logo size="sm" />
            <Logo size="default" showText={false} />
          </div>
        </div>

        <Separator />

        {/* 3D Character Mascot */}
        <section>
          <h2 className="text-lg font-semibold mb-4">3D Character Mascot</h2>
          <div className="flex flex-wrap items-end gap-8">
            {/* Character Display */}
            <Card className="p-4">
              <div className="flex flex-col items-center gap-4">
                <Character pose={characterPose} size="lg" interactive />
                <Label>Interactive (drag to rotate)</Label>
              </div>
            </Card>

            {/* Pose Selection */}
            <div className="space-y-3">
              <Label>Select Pose</Label>
              <div className="grid grid-cols-3 gap-2">
                {(["idle", "presenting", "thumbsUp", "thinking", "pointing", "celebrating"] as CharacterPose[]).map((pose) => (
                  <Button
                    key={pose}
                    variant={characterPose === pose ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setCharacterPose(pose)}
                  >
                    {pose}
                  </Button>
                ))}
              </div>
            </div>

            {/* Size Variants */}
            <div className="space-y-3">
              <Label>Size Variants</Label>
              <div className="flex items-end gap-4">
                <div className="flex flex-col items-center gap-1">
                  <Character pose="idle" size="sm" />
                  <span className="text-xs text-muted-foreground">sm</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <Character pose="presenting" size="md" />
                  <span className="text-xs text-muted-foreground">md</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <Separator />

        {/* Alerts */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Alerts</h2>
          <div className="space-y-3 max-w-lg">
            <Alert>
              <AlertTitle>Information</AlertTitle>
              <AlertDescription>This is a default informational alert.</AlertDescription>
            </Alert>
            <Alert variant="success">
              <AlertTitle>Success!</AlertTitle>
              <AlertDescription>Your exercise session was saved successfully.</AlertDescription>
            </Alert>
            <Alert variant="warning" dismissible onDismiss={() => {}}>
              <AlertTitle>Warning</AlertTitle>
              <AlertDescription>Your streak is at risk! Exercise today to keep it.</AlertDescription>
            </Alert>
            <Alert variant="error">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>Camera access was denied. Please enable it in settings.</AlertDescription>
            </Alert>
          </div>
        </section>

        <Separator />

        {/* Dialog, Sheet, Select */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Dialogs, Sheets & Selects</h2>
          <div className="flex flex-wrap items-start gap-4">
            {/* Dialog */}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="primary">Open Dialog</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Example Dialog</DialogTitle>
                  <DialogDescription>
                    This is a dialog with header, content, and footer sections.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <p className="text-sm text-muted-foreground">
                    Dialog content goes here. You can put forms, information, or any content.
                  </p>
                </div>
                <DialogFooter>
                  <Button variant="ghost">Cancel</Button>
                  <Button variant="secondary">Save Changes</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Sheet */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost">
                  <Menu size={16} className="mr-1" /> Open Sheet
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <SheetHeader>
                  <SheetTitle>Mobile Menu</SheetTitle>
                  <SheetDescription>
                    A slide-out panel for mobile navigation or forms.
                  </SheetDescription>
                </SheetHeader>
                <div className="py-4 space-y-2">
                  <Button variant="ghost" className="w-full justify-start">Dashboard</Button>
                  <Button variant="ghost" className="w-full justify-start">Exercises</Button>
                  <Button variant="ghost" className="w-full justify-start">History</Button>
                  <Button variant="ghost" className="w-full justify-start">Settings</Button>
                </div>
              </SheetContent>
            </Sheet>

            {/* Select */}
            <div className="w-48">
              <Label className="mb-2 block">Exercise Type</Label>
              <Select value={selectValue} onValueChange={setSelectValue}>
                <SelectTrigger placeholder="Choose exercise...">
                  <SelectValue placeholder="Choose exercise..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cat-camel">Cat-Camel</SelectItem>
                  <SelectItem value="cobra">Cobra Stretch</SelectItem>
                  <SelectItem value="dead-bug">Dead Bug</SelectItem>
                  <SelectItem value="bird-dog">Bird Dog</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Confirm Dialog */}
            <div>
              <Button variant="destructive" onClick={() => setConfirmOpen(true)}>
                End Session
              </Button>
              <ConfirmDialog
                open={confirmOpen}
                onOpenChange={setConfirmOpen}
                title="End Session?"
                description="Are you sure you want to end this session? Your progress will be saved."
                confirmLabel="End Session"
                cancelLabel="Keep Going"
                onConfirm={() => alert("Session ended!")}
                variant="destructive"
              />
            </div>
          </div>
        </section>

        <Separator />

        {/* Session Controls */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Session Controls</h2>
          <div className="flex flex-wrap items-start gap-8">
            <div className="space-y-2">
              <Label>Default</Label>
              <SessionControls
                isPaused={isPaused}
                onPause={() => setIsPaused(true)}
                onResume={() => setIsPaused(false)}
                onEnd={() => alert("End!")}
                onHelp={() => alert("Help!")}
              />
            </div>
            <div className="space-y-2">
              <Label>Small (no help)</Label>
              <SessionControls
                size="sm"
                isPaused={false}
                onPause={() => {}}
                onResume={() => {}}
                onEnd={() => {}}
                showHelp={false}
              />
            </div>
          </div>
        </section>

        <Separator />

        {/* NEW: Cards */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Cards</h2>
          <div className="flex flex-wrap gap-4">
            <Card className="w-64">
              <CardHeader>
                <CardTitle>Default Card</CardTitle>
                <CardDescription>A simple content container</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">Card content goes here.</p>
              </CardContent>
              <CardFooter>
                <Button variant="ghost" size="sm">Action</Button>
              </CardFooter>
            </Card>
            <Card variant="elevated" className="w-64">
              <CardHeader>
                <CardTitle>Elevated Card</CardTitle>
                <CardDescription>More prominent shadow</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">For important content.</p>
              </CardContent>
            </Card>
            <Card variant="outlined" className="w-64">
              <CardHeader>
                <CardTitle>Outlined Card</CardTitle>
                <CardDescription>Border style variant</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm">Subtle container.</p>
              </CardContent>
            </Card>
          </div>
        </section>

        <Separator />

        {/* NEW: Form Elements */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Form Elements</h2>
          <div className="flex flex-wrap gap-8">
            <div className="space-y-2">
              <Label htmlFor="name" required>Name</Label>
              <Input id="name" placeholder="Enter your name..." />
            </div>
            <div className="space-y-2">
              <Label>Notifications</Label>
              <div className="flex items-center gap-3">
                <Switch checked={switchChecked} onCheckedChange={setSwitchChecked} />
                <span className="text-sm text-muted-foreground">
                  {switchChecked ? "Enabled" : "Disabled"}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Switch Sizes</Label>
              <div className="flex items-center gap-4">
                <Switch size="sm" checked />
                <Switch size="default" checked />
              </div>
            </div>
          </div>
        </section>

        <Separator />

        {/* Progress, Slider, Checkbox */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Progress, Slider & Checkbox</h2>
          <div className="space-y-6 max-w-md">
            {/* Progress Bars */}
            <div className="space-y-3">
              <Label>Progress Bars</Label>
              <Progress value={75} />
              <Progress value={45} showValue />
              <Progress value={90} color="coral" size="lg" />
              <Progress value={30} size="sm" />
            </div>

            {/* Slider */}
            <div className="space-y-3">
              <Label>Slider</Label>
              <Slider value={sliderValue} onValueChange={setSliderValue} showValue />
              <Slider defaultValue={25} min={0} max={100} step={5} />
            </div>

            {/* Checkboxes */}
            <div className="space-y-3">
              <Label>Checkboxes</Label>
              <div className="space-y-2">
                <Checkbox
                  label="Enable notifications"
                  checked={checkboxChecked}
                  onCheckedChange={setCheckboxChecked}
                />
                <Checkbox label="Send weekly reports" defaultChecked />
                <Checkbox label="Disabled option" disabled />
              </div>
            </div>
          </div>
        </section>

        <Separator />

        {/* Tooltip & Popover */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Tooltip & Popover</h2>
          <div className="flex flex-wrap items-start gap-8">
            {/* Tooltips */}
            <div className="space-y-3">
              <Label>Tooltips</Label>
              <div className="flex items-center gap-4">
                <Tooltip content="This is a tooltip" side="top">
                  <Button variant="ghost" size="icon">
                    <Info size={18} />
                  </Button>
                </Tooltip>
                <Tooltip content="Settings" side="bottom">
                  <Button variant="ghost" size="icon">
                    <Settings size={18} />
                  </Button>
                </Tooltip>
                <Tooltip content="Left tooltip" side="left">
                  <Badge>Hover me</Badge>
                </Tooltip>
                <Tooltip content="Right tooltip" side="right">
                  <Badge variant="active">Or me</Badge>
                </Tooltip>
              </div>
            </div>

            {/* Popover */}
            <div className="space-y-3">
              <Label>Popover</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="secondary">Open Popover</Button>
                </PopoverTrigger>
                <PopoverContent className="w-64">
                  <div className="space-y-2">
                    <h4 className="font-semibold">Settings</h4>
                    <p className="text-sm text-muted-foreground">
                      Configure your preferences here.
                    </p>
                    <Checkbox label="Dark mode" />
                    <Checkbox label="Sounds" defaultChecked />
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </section>

        <Separator />

        {/* NEW: Tabs */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Tabs</h2>
          <Tabs defaultValue="overview" className="w-full max-w-md">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            <TabsContent value="overview">
              <Card>
                <CardContent className="pt-4">
                  <p className="text-sm">Overview content here.</p>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="analytics">
              <Card>
                <CardContent className="pt-4">
                  <p className="text-sm">Analytics data here.</p>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="settings">
              <Card>
                <CardContent className="pt-4">
                  <p className="text-sm">Settings options here.</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </section>

        <Separator />

        {/* NEW: Loading States */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Loading States</h2>
          <div className="flex flex-wrap gap-8">
            <div className="space-y-2">
              <Label>Loading Spinners</Label>
              <div className="flex items-center gap-4">
                <LoadingSpinner size="sm" />
                <LoadingSpinner size="default" />
                <LoadingSpinner size="lg" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Skeletons</Label>
              <div className="space-y-2 w-48">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Skeleton Variants</Label>
              <div className="flex items-center gap-3">
                <Skeleton variant="circular" className="h-10 w-10" />
                <div className="space-y-1">
                  <Skeleton variant="text" className="w-24" />
                  <Skeleton variant="text" className="w-16" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <Separator />

        {/* NEW: Workout Components */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Workout Components</h2>
          <div className="flex flex-wrap items-start gap-8">
            <div className="space-y-2">
              <Label>Rep Counter</Label>
              <div className="flex gap-4 items-center">
                <RepCounter current={repCount} target={10} />
                <div className="flex flex-col gap-1">
                  <Button variant="ghost" size="sm" onClick={() => setRepCount(Math.min(10, repCount + 1))}>
                    +1 Rep
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setRepCount(0)}>
                    Reset
                  </Button>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Rep Counter (Complete)</Label>
              <RepCounter current={10} target={10} />
            </div>
            <div className="space-y-2">
              <Label>Session Timer</Label>
              <SessionTimer startTime={sessionStart} />
            </div>
            <div className="space-y-2">
              <Label>Timer (Paused)</Label>
              <SessionTimer startTime={sessionStart} isPaused />
            </div>
          </div>
        </section>

        <Separator />

        {/* NEW: Dashboard Components */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Dashboard Components</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatsCard
              title="Total Reps Today"
              value={42}
              icon={Repeat}
              trend={{ direction: "up", value: "+12%" }}
            />
            <StatsCard
              title="Session Time"
              value="32:15"
              icon={Clock}
              variant="sage"
            />
            <StatsCard
              title="Weekly Goal"
              value="4/5"
              icon={Target}
              trend={{ direction: "neutral", value: "1 to go" }}
              variant="coral"
            />
          </div>
        </section>

        <Separator />

        {/* NEW: Streak & Weekly Calendar */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Streak & Activity</h2>
          <div className="flex flex-wrap items-start gap-8">
            <Card className="p-4">
              <StreakDisplay currentStreak={7} bestStreak={12} />
            </Card>
            <Card className="p-4">
              <StreakDisplay
                currentStreak={3}
                bestStreak={12}
                lastActiveDate={new Date(Date.now() - 22 * 60 * 60 * 1000)}
              />
            </Card>
            <Card className="p-4">
              <Label className="mb-3 block">Weekly Activity</Label>
              <WeeklyCalendar
                activities={[
                  { date: new Date().toISOString().split("T")[0], completed: true },
                  { date: new Date(Date.now() - 86400000).toISOString().split("T")[0], completed: true },
                  { date: new Date(Date.now() - 86400000 * 2).toISOString().split("T")[0], completed: false },
                  { date: new Date(Date.now() - 86400000 * 3).toISOString().split("T")[0], completed: true },
                ]}
              />
            </Card>
          </div>
        </section>

        <Separator />

        {/* NEW: Empty State */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Empty State</h2>
          <Card>
            <EmptyState
              icon={History}
              title="No sessions yet"
              description="Complete your first workout to see your history here."
              action={{
                label: "Start Workout",
                onClick: () => alert("Start workout clicked!"),
              }}
            />
          </Card>
        </section>

        <Separator />

        {/* Voice Indicator */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Voice Indicator States</h2>
          <div className="flex items-end gap-8">
            <VoiceIndicator state="idle" size="md" />
            <VoiceIndicator state="connecting" size="md" />
            <VoiceIndicator state="listening" size="md" />
            <VoiceIndicator state="thinking" size="md" />
            <VoiceIndicator state="speaking" size="md" />
          </div>
        </section>

        <Separator />

        {/* Search Bar */}
        <section className="space-y-6">
          <h2 className="text-lg font-semibold">Search Bar</h2>
          <SearchBar
            placeholder="Search..."
            avatarFallback="JD"
            hasNotification={true}
          />
        </section>

        <Separator />

        {/* Custom Icons */}
        <section className="space-y-6">
          <h2 className="text-lg font-semibold">Custom Icons</h2>

          {/* Core App Icons - Sage */}
          <div>
            <Label className="mb-3 block">Core App Icons (Sage)</Label>
            <div className="flex flex-wrap items-end gap-6">
              <div className="flex flex-col items-center gap-2">
                <CalendarIcon size="lg" />
                <span className="text-xs text-muted-foreground">Calendar</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <SpineIcon size="lg" />
                <span className="text-xs text-muted-foreground">Spine</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <PoseIcon size="lg" />
                <span className="text-xs text-muted-foreground">Pose</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <MicrophoneIcon size="lg" />
                <span className="text-xs text-muted-foreground">Microphone</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <TrophyIcon size="lg" />
                <span className="text-xs text-muted-foreground">Trophy</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <CameraIcon size="lg" />
                <span className="text-xs text-muted-foreground">Camera</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <TimerIcon size="lg" />
                <span className="text-xs text-muted-foreground">Timer</span>
              </div>
            </div>
          </div>

          {/* Core App Icons - Coral */}
          <div>
            <Label className="mb-3 block">Core App Icons (Coral)</Label>
            <div className="flex flex-wrap items-end gap-6">
              <div className="flex flex-col items-center gap-2">
                <CalendarIcon size="lg" variant="coral" />
                <span className="text-xs text-muted-foreground">Calendar</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <SpineIcon size="lg" variant="coral" />
                <span className="text-xs text-muted-foreground">Spine</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <PoseIcon size="lg" variant="coral" />
                <span className="text-xs text-muted-foreground">Pose</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <MicrophoneIcon size="lg" variant="coral" />
                <span className="text-xs text-muted-foreground">Microphone</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <TrophyIcon size="lg" variant="coral" />
                <span className="text-xs text-muted-foreground">Trophy</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <CameraIcon size="lg" variant="coral" />
                <span className="text-xs text-muted-foreground">Camera</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <TimerIcon size="lg" variant="coral" />
                <span className="text-xs text-muted-foreground">Timer</span>
              </div>
            </div>
          </div>

          {/* Exercise Category Icons - Sage */}
          <div>
            <Label className="mb-3 block">Exercise Category Icons (Sage)</Label>
            <div className="flex flex-wrap items-end gap-6">
              <div className="flex flex-col items-center gap-2">
                <MobilityIcon size="lg" />
                <span className="text-xs text-muted-foreground">Mobility</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <StabilityIcon size="lg" />
                <span className="text-xs text-muted-foreground">Stability</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <StrengthIcon size="lg" />
                <span className="text-xs text-muted-foreground">Strength</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <StretchIcon size="lg" />
                <span className="text-xs text-muted-foreground">Stretch</span>
              </div>
            </div>
          </div>

          {/* Exercise Category Icons - Coral */}
          <div>
            <Label className="mb-3 block">Exercise Category Icons (Coral)</Label>
            <div className="flex flex-wrap items-end gap-6">
              <div className="flex flex-col items-center gap-2">
                <MobilityIcon size="lg" variant="coral" />
                <span className="text-xs text-muted-foreground">Mobility</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <StabilityIcon size="lg" variant="coral" />
                <span className="text-xs text-muted-foreground">Stability</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <StrengthIcon size="lg" variant="coral" />
                <span className="text-xs text-muted-foreground">Strength</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <StretchIcon size="lg" variant="coral" />
                <span className="text-xs text-muted-foreground">Stretch</span>
              </div>
            </div>
          </div>

          {/* Icon Sizes */}
          <div>
            <Label className="mb-3 block">Icon Sizes</Label>
            <div className="flex items-end gap-6">
              <div className="flex flex-col items-center gap-2">
                <SpineIcon size="sm" />
                <span className="text-xs text-muted-foreground">sm (24px)</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <SpineIcon size="md" />
                <span className="text-xs text-muted-foreground">md (32px)</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <SpineIcon size="lg" />
                <span className="text-xs text-muted-foreground">lg (48px)</span>
              </div>
            </div>
          </div>
        </section>

        <Separator />

        {/* Calendar Component */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Calendar Component</h2>
          <Calendar
            selectedDate={new Date(2025, 11, 23)}
            markedDates={[
              new Date(2025, 11, 10),
              new Date(2025, 11, 15),
              new Date(2025, 11, 28),
            ]}
          />
        </section>

        <Separator />

        {/* Buttons */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Buttons</h2>
          <div className="flex flex-wrap items-center gap-4">
            <Button variant="primary">
              Start Session <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="secondary">Earn Session</Button>
            <Button variant="destructive">End Session</Button>
            <Button variant="ghost">
              <Pause className="h-4 w-4" /> Pause
            </Button>
            <Button variant="icon" size="icon">
              <Play className="h-5 w-5" />
            </Button>
          </div>
        </section>

        <Separator />

        {/* Badges */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Badges</h2>
          <div className="space-y-4">
            <div>
              <Label className="mb-2 block">Default Variants</Label>
              <div className="flex flex-wrap items-center gap-3">
                <Badge>Exercises</Badge>
                <Badge variant="active">Weekly</Badge>
                <Badge variant="muted">30 minutes</Badge>
                <Badge variant="outlined">Upper Body</Badge>
              </div>
            </div>
            <div>
              <Label className="mb-2 block">Difficulty Levels</Label>
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="easy">Easy</Badge>
                <Badge variant="medium">Medium</Badge>
                <Badge variant="hard">Hard</Badge>
              </div>
            </div>
            <div>
              <Label className="mb-2 block">Status Indicators</Label>
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant="success">Success</Badge>
                <Badge variant="warning">Warning</Badge>
                <Badge variant="error">Error</Badge>
                <Badge variant="info">Info</Badge>
                <Badge variant="coral">Coral</Badge>
              </div>
            </div>
            <div>
              <Label className="mb-2 block">Sizes</Label>
              <div className="flex flex-wrap items-center gap-3">
                <Badge size="sm">Small</Badge>
                <Badge size="default">Default</Badge>
                <Badge size="lg" variant="active">Large</Badge>
              </div>
            </div>
          </div>
        </section>

        <Separator />

        {/* Textarea */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Textarea</h2>
          <div className="max-w-md space-y-2">
            <Label>Session Notes</Label>
            <Textarea placeholder="Add notes about your session..." />
          </div>
        </section>

        <Separator />

        {/* RadioGroup */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Radio Group</h2>
          <div className="max-w-sm">
            <Label className="mb-3 block">Difficulty Level</Label>
            <RadioGroup value={radioValue} onValueChange={setRadioValue}>
              <RadioGroupItem value="easy">Easy - Gentle movements</RadioGroupItem>
              <RadioGroupItem value="medium">Medium - Moderate intensity</RadioGroupItem>
              <RadioGroupItem value="hard">Hard - Challenging workout</RadioGroupItem>
            </RadioGroup>
          </div>
        </section>

        <Separator />

        {/* Breadcrumb */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Breadcrumb</h2>
          <Breadcrumb
            items={[
              { label: "Exercises", icon: <Folder className="h-4 w-4" /> },
              { label: "Upper Body" },
              { label: "Cat-Camel" },
            ]}
            onNavigate={(item) => alert(`Navigate to: ${item.label}`)}
          />
        </section>

        <Separator />

        {/* Collapsible & Accordion */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Collapsible & Accordion</h2>
          <div className="space-y-6 max-w-md">
            {/* Single Collapsible */}
            <div>
              <Label className="mb-3 block">Single Collapsible</Label>
              <Collapsible open={collapsibleOpen} onOpenChange={setCollapsibleOpen}>
                <CollapsibleTrigger>Session Details</CollapsibleTrigger>
                <CollapsibleContent>
                  This session included 3 exercises: Cat-Camel (10 reps), Cobra Stretch (8 reps),
                  and Dead Bug (12 reps). Total time: 15 minutes.
                </CollapsibleContent>
              </Collapsible>
            </div>

            {/* Accordion */}
            <div>
              <Label className="mb-3 block">Accordion</Label>
              <Accordion type="single" defaultValue="exercise-1">
                <AccordionItem value="exercise-1">
                  <AccordionTrigger>Cat-Camel Stretch</AccordionTrigger>
                  <AccordionContent>
                    A gentle spinal mobility exercise. Start on hands and knees,
                    alternate between arching and rounding your back.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="exercise-2">
                  <AccordionTrigger>Cobra Stretch</AccordionTrigger>
                  <AccordionContent>
                    Lie face down, place hands under shoulders, and gently push up
                    to extend your spine while keeping hips on the ground.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="exercise-3">
                  <AccordionTrigger>Dead Bug</AccordionTrigger>
                  <AccordionContent>
                    Lie on your back with arms extended up and knees bent at 90°.
                    Lower opposite arm and leg while maintaining core stability.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </section>

        <Separator />

        {/* ToggleGroup */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Toggle Group</h2>
          <div className="space-y-4">
            <div>
              <Label className="mb-3 block">Exercise Category Filter</Label>
              <ToggleGroup type="single" value={toggleValue} onValueChange={(v) => setToggleValue(typeof v === "string" ? v : v[0] || "all")}>
                <ToggleGroupItem value="all">All</ToggleGroupItem>
                <ToggleGroupItem value="mobility">Mobility</ToggleGroupItem>
                <ToggleGroupItem value="strength">Strength</ToggleGroupItem>
                <ToggleGroupItem value="stability">Stability</ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>
        </section>

        <Separator />

        {/* NumberInput */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Number Input</h2>
          <div className="flex flex-wrap gap-8">
            <NumberInput
              label="Target Reps"
              value={numberValue}
              onChange={setNumberValue}
              min={1}
              max={30}
            />
            <NumberInput
              label="Session Duration"
              defaultValue={15}
              min={5}
              max={60}
              step={5}
              suffix="min"
            />
          </div>
        </section>

        <Separator />

        {/* Pagination */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Pagination</h2>
          <Pagination
            currentPage={currentPage}
            totalPages={10}
            onPageChange={setCurrentPage}
          />
        </section>

        <Separator />

        {/* Table */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Table</h2>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Exercise</TableHead>
                <TableHead>Reps</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Dec 23, 2025</TableCell>
                <TableCell>Cat-Camel</TableCell>
                <TableCell>10</TableCell>
                <TableCell>5:30</TableCell>
                <TableCell><Badge variant="success" size="sm">95%</Badge></TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Dec 22, 2025</TableCell>
                <TableCell>Cobra Stretch</TableCell>
                <TableCell>8</TableCell>
                <TableCell>4:15</TableCell>
                <TableCell><Badge variant="success" size="sm">88%</Badge></TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Dec 21, 2025</TableCell>
                <TableCell>Dead Bug</TableCell>
                <TableCell>12</TableCell>
                <TableCell>6:00</TableCell>
                <TableCell><Badge variant="warning" size="sm">72%</Badge></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </section>

        <Separator />

        {/* DatePicker */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Date Picker</h2>
          <div className="flex flex-wrap gap-8">
            <div>
              <Label className="mb-2 block">Single Date</Label>
              <DatePicker
                value={selectedDate}
                onChange={setSelectedDate}
                placeholder="Pick a date"
              />
            </div>
          </div>
        </section>

        <Separator />

        {/* Input */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Input</h2>
          <div className="flex flex-col gap-4 max-w-sm">
            <Input placeholder="Enter your name..." />
            <Input icon={<Search className="h-4 w-4" />} placeholder="Search exercises..." />
          </div>
        </section>

        <Separator />

        {/* Progress Ring */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Progress Ring</h2>
          <div className="flex flex-wrap items-center gap-6">
            <ProgressRing value={95} size="lg" />
            <ProgressRing value={75} size="default" />
            <ProgressRing value={50} size="sm" />
            <ProgressRing value={60} size="default" color="coral" />
          </div>
        </section>

        <Separator />

        {/* Exercise Cards */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Exercise Cards</h2>
          <div className="flex flex-wrap gap-4">
            <ExerciseCard name="Torso Press 2" category="Exercise" duration="30 minutes" />
            <ExerciseCard name="Short Wave" category="Exercise" duration="30 minutes" />
            <ExerciseCard name="T Spine Secara" category="Exercise" duration="30 minutes" />
            <ExerciseCard name="Torso Stretch" category="Exercise" duration="30 minutes" />
          </div>
        </section>

        <Separator />

        {/* Surface Classes Demo */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Reusable Surfaces</h2>
          <div className="flex flex-wrap gap-4">
            <div className="surface-soft p-4 w-32 text-center">
              <span className="text-sm">surface-soft</span>
            </div>
            <div className="surface-sage p-4 w-32 text-center">
              <span className="text-sm">surface-sage</span>
            </div>
            <div className="surface-coral p-4 w-32 text-center">
              <span className="text-sm">surface-coral</span>
            </div>
            <div className="surface-outlined p-4 w-32 text-center">
              <span className="text-sm">surface-outlined</span>
            </div>
          </div>
        </section>

        <Separator />

        {/* Avatar */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Avatar</h2>
          <div className="flex flex-wrap items-center gap-4">
            <Avatar size="sm" />
            <Avatar size="default" />
            <Avatar size="lg" />
            <Avatar size="default" fallback="SF" />
            <Avatar size="lg" fallback="JD" />
          </div>
        </section>
      </div>
    </div>
  );
}
