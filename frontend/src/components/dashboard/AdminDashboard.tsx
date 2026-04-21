import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useUsers } from '@/hooks/useUsers';
import { useRoles } from '@/hooks/useRoles';
import { useLocations } from '@/hooks/useLocations';
import { useResources } from '@/hooks/useResources';
import { useTopResources, usePeakBookingHours, useTopItemsForHour } from '@/hooks/useAnalytics';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';
import { Users, Shield, Building2, MapPin, ArrowRight, BarChart3, Activity } from 'lucide-react';

function PeakHourDetails({ hourOfDay }: { hourOfDay: number }) {
  const { data, isLoading } = useTopItemsForHour(hourOfDay, 3);
  if (isLoading) return <div className="text-xs text-muted-foreground mt-2 pl-2">Loading top items...</div>;
  if (!data || data.length === 0) return <div className="text-xs text-muted-foreground mt-2 pl-2">No specific item data available.</div>;
  
  return (
    <ul className="mt-2 text-xs text-muted-foreground space-y-1.5 pl-3 border-l-2 border-rose-500/30">
      {data.map((item, i) => (
        <li key={i} className="flex justify-between items-center pr-4">
          <span className="truncate pr-2">{item.itemName}</span>
          <span className="font-medium bg-secondary px-1.5 rounded-sm">{item.bookingCount}</span>
        </li>
      ))}
    </ul>
  );
}

export function AdminDashboard() {
  const [expandedHour, setExpandedHour] = useState<number | null>(null);
  const { data: usersPage, isLoading: usersLoading } = useUsers({ size: 1 });
  const { data: rolesList, isLoading: rolesLoading } = useRoles();
  const { data: locationsList, isLoading: locationsLoading } = useLocations();
  const { data: resourcesPage, isLoading: resourcesLoading } = useResources({ size: 1 });

  const { data: topResources } = useTopResources(5);
  const { data: peakHours } = usePeakBookingHours();

  const maxBookingCount = topResources?.length
    ? Math.max(...topResources.map(r => r.bookingCount))
    : 1;

  const maxHourCount = peakHours?.length
    ? Math.max(...peakHours.map(h => h.bookingCount))
    : 1;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">

      {/* High-Level Stat Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {usersLoading ? '-' : usersPage?.totalElements ?? 0}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">System Roles</CardTitle>
            <Shield className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {rolesLoading ? '-' : rolesList?.length ?? 0}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Locations</CardTitle>
            <Building2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {locationsLoading ? '-' : locationsList?.length ?? 0}
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Resources</CardTitle>
            <MapPin className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {resourcesLoading ? '-' : resourcesPage?.totalElements ?? 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Usage Analytics Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Top Resources Chart */}
        <Card className="shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-indigo-500" />
              <CardTitle>Top Resources</CardTitle>
            </div>
            <CardDescription>Most frequently booked resources on the platform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(!topResources || topResources.length === 0) ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  No booking data available.
                </div>
              ) : (
                topResources.map((resource, i) => {
                  const width = Math.max((resource.bookingCount / maxBookingCount) * 100, 2);
                  return (
                    <div key={i} className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium truncate pr-4">{resource.resourceName}</span>
                        <span className="text-muted-foreground">{resource.bookingCount} bookings</span>
                      </div>
                      <div className="h-2 w-full bg-secondary rounded-full overflow-hidden flex">
                        <div
                          className="h-full bg-indigo-500 rounded-full transition-all duration-1000 ease-out"
                          style={{ width: `${width}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

        {/* Peak Booking Hours */}
        <Card className="shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-rose-500" />
              <CardTitle>Peak Booking Hours</CardTitle>
            </div>
            <CardDescription>Overall times with the highest booking volume</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 mt-2">
              {(!peakHours || peakHours.length === 0) ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  No booking data available.
                </div>
              ) : (
                // Display up to 8 peak hours properly formated, sorted chronologically
                [...peakHours]
                  .sort((a, b) => a.hourOfDay - b.hourOfDay)
                  .slice(0, 8)
                  .map((hr, i) => {
                    const width = Math.max((hr.bookingCount / maxHourCount) * 100, 2);
                    
                    // User friendly hour range parsing (e.g. "11:00 AM - 12:00 PM")
                    const formatTime = (h: number) => h === 0 ? '12:00 AM' : h < 12 ? `${h}:00 AM` : h === 12 ? '12:00 PM' : `${h - 12}:00 PM`;
                    const startTime = formatTime(hr.hourOfDay);
                    const endTime = formatTime((hr.hourOfDay + 1) % 24);
                    
                    const isExpanded = expandedHour === hr.hourOfDay;
                    
                    return (
                      <div key={i} className="flex flex-col gap-1.5">
                        <div 
                          className="flex items-center justify-between text-sm cursor-pointer group hover:bg-muted/30 p-1 -mx-1 rounded transition-colors"
                          onClick={() => setExpandedHour(isExpanded ? null : hr.hourOfDay)}
                        >
                          <span className="font-medium text-foreground group-hover:text-rose-600 transition-colors">
                            {startTime} — {endTime}
                          </span>
                          <span className="text-muted-foreground group-hover:text-foreground transition-colors text-xs">{hr.bookingCount} active</span>
                        </div>
                        <div className="h-2 w-full bg-secondary rounded-full overflow-hidden flex">
                          <div
                            className="h-full bg-rose-500 rounded-full transition-all duration-1000 ease-out"
                            style={{ width: `${width}%` }}
                          />
                        </div>
                        {isExpanded && (
                          <div className="animate-in slide-in-from-top-2 fade-in duration-200">
                             <PeakHourDetails hourOfDay={hr.hourOfDay} />
                          </div>
                        )}
                      </div>
                    );
                  })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
