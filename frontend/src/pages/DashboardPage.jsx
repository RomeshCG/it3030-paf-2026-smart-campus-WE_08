import { useAuth } from '@/context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  LayoutDashboard, 
  BookOpen, 
  Calendar, 
  Settings, 
  LogOut, 
  Bell, 
  Search,
  GraduationCap,
  Users,
  Clock,
  TrendingUp,
  MoreVertical
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const stats = [
    { title: "Enrolled Courses", value: "6", icon: BookOpen, color: "text-blue-500", bg: "bg-blue-500/10" },
    { title: "Attendance", value: "94%", icon: Clock, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { title: "Total Credits", value: "48", icon: GraduationCap, color: "text-indigo-500", bg: "bg-indigo-500/10" },
    { title: "Current GPA", value: "3.82", icon: TrendingUp, color: "text-amber-500", bg: "bg-amber-500/10" },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 hidden h-screen w-64 border-r border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950 lg:block">
        <div className="flex items-center gap-2 mb-10 px-2">
          <div className="p-2 bg-indigo-600 rounded-lg">
            <GraduationCap className="size-6 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">Smart Campus</span>
        </div>

        <nav className="space-y-1">
          <NavItem icon={LayoutDashboard} label="Dashboard" active />
          <NavItem icon={BookOpen} label="My Courses" />
          <NavItem icon={Calendar} label="Schedule" />
          <NavItem icon={Users} label="Community" />
          <div className="pt-4 pb-2">
            <p className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Settings</p>
          </div>
          <NavItem icon={Settings} label="Preferences" />
        </nav>

        <div className="absolute bottom-8 left-0 w-full px-6">
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-3 text-slate-500 hover:text-destructive hover:bg-destructive/5"
            onClick={handleLogout}
          >
            <LogOut className="size-5" />
            Sign out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64">
        {/* Top Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-8 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/80">
          <div className="relative w-96 max-w-full hidden md:block">
            <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search courses, tasks, files..." 
              className="w-full rounded-full border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm outline-none transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 dark:border-slate-800 dark:bg-slate-900"
            />
          </div>

          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="relative text-slate-500">
              <Bell className="size-5" />
              <span className="absolute right-2 top-2 size-2 rounded-full bg-destructive border-2 border-white dark:border-slate-950" />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-10 gap-3 px-2 hover:bg-slate-100 dark:hover:bg-slate-900 text-left">
                  <Avatar className="size-8 border border-slate-200 dark:border-slate-800">
                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name}`} />
                    <AvatarFallback>{user?.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="hidden sm:block">
                    <p className="text-sm font-semibold leading-none">{user?.name}</p>
                    <p className="text-xs text-slate-400 mt-1 capitalize">{user?.role}</p>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Profile Settings</DropdownMenuItem>
                <DropdownMenuItem>Academic Records</DropdownMenuItem>
                <DropdownMenuItem>Billing</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={handleLogout}>
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-8 pb-12">
          {/* Welcome Section */}
          <div className="mb-10">
            <h1 className="text-3xl font-bold tracking-tight">Morning, {user?.name?.split(' ')[0]} 👋</h1>
            <p className="text-slate-500 mt-1">Here's what happening with your studies today.</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {stats.map((stat, i) => (
              <Card key={i} className="border-slate-200/60 dark:border-slate-800 shadow-sm transition-all hover:shadow-md">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-2 rounded-lg ${stat.bg}`}>
                      <stat.icon className={`size-5 ${stat.color}`} />
                    </div>
                    <Button variant="ghost" size="icon" className="size-7">
                      <MoreVertical className="size-4 text-slate-400" />
                    </Button>
                  </div>
                  <div>
                    <CardTitle className="text-3xl font-bold tracking-tight mb-1">{stat.value}</CardTitle>
                    <CardDescription className="text-slate-500 font-medium">{stat.title}</CardDescription>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Tabs Section */}
          <Tabs defaultValue="overview" className="space-y-6">
            <div className="flex items-center justify-between">
              <TabsList className="bg-slate-100 dark:bg-slate-900">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="courses">My Courses</TabsTrigger>
                <TabsTrigger value="schedule">Schedule</TabsTrigger>
              </TabsList>
              <Button className="hidden sm:flex bg-indigo-600 hover:bg-indigo-700">Add New Module</Button>
            </div>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Recent Activity */}
                <Card className="lg:col-span-2 border-slate-200/60 dark:border-slate-800 shadow-sm">
                  <CardHeader>
                    <CardTitle>Recent Performance</CardTitle>
                    <CardDescription>Your quiz and assignment grades over the last 30 days.</CardDescription>
                  </CardHeader>
                  <CardContent className="h-64 flex items-center justify-center text-slate-400 border-t border-slate-50 dark:border-slate-900 mt-4">
                    <div className="text-center">
                      <LayoutDashboard className="size-10 mx-auto mb-2 opacity-20" />
                      <p className="text-sm">Performance metrics chart will appear here.</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Upcoming Tasks */}
                <Card className="border-slate-200/60 dark:border-slate-800 shadow-sm">
                  <CardHeader>
                    <CardTitle>Upcoming Tasks</CardTitle>
                    <CardDescription>Don't miss these deadlines.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-4">
                    <TaskItem 
                      title="Database Systems Quiz" 
                      time="Today, 2:00 PM" 
                      category="Academic" 
                      color="bg-amber-500" 
                    />
                    <TaskItem 
                      title="PAF Project Submission" 
                      time="Tomorrow, 11:59 PM" 
                      category="Project" 
                      color="bg-indigo-500" 
                    />
                    <TaskItem 
                      title="Web Security Workshop" 
                      time="Friday, 10:00 AM" 
                      category="Event" 
                      color="bg-purple-500" 
                    />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}

function NavItem({ icon: Icon, label, active = false }) {
  return (
    <Link 
      to="#" 
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
        active 
          ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400' 
          : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-900 dark:hover:text-slate-100'
      }`}
    >
      <Icon className={`size-5 ${active ? 'text-indigo-600 dark:text-indigo-400' : ''}`} />
      {label}
    </Link>
  );
}

function TaskItem({ title, time, category, color }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-900 hover:bg-slate-50 dark:hover:bg-cyan-900/5 transition-colors cursor-pointer">
      <div className="flex items-center gap-3">
        <div className={`size-2 rounded-full ${color}`} />
        <div>
          <p className="text-sm font-semibold">{title}</p>
          <p className="text-xs text-slate-400">{time}</p>
        </div>
      </div>
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-900">
        {category}
      </span>
    </div>
  );
}
