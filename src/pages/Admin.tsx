import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ArrowLeft, Users, BarChart3, CreditCard, Trash2, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { toast } from "sonner";

interface Analysis {
  id: string;
  signal: string;
  confidence: number;
  asset_type: string;
  created_at: string;
  title: string | null;
  user_id: string | null;
}

interface Profile {
  email: string;
}

interface Stats {
  totalUsers: number;
  totalAnalyses: number;
  activeSubscriptions: number;
}

export default function Admin() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats>({ totalUsers: 0, totalAnalyses: 0, activeSubscriptions: 0 });
  const [analyses, setAnalyses] = useState<(Analysis & { profiles: Profile | null })[]>([]);

  useEffect(() => {
    checkAdminAndFetchData();
  }, []);

  const checkAdminAndFetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data: adminCheck } = await supabase.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    if (!adminCheck) {
      toast.error("Unauthorized access");
      navigate("/");
      return;
    }

    setIsAdmin(true);
    await fetchStats();
    await fetchAnalyses();
    setLoading(false);
  };

  const fetchStats = async () => {
    try {
      const [usersRes, analysesRes, subsRes] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('chart_analyses').select('*', { count: 'exact', head: true }),
        supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'completed').gt('expires_at', new Date().toISOString())
      ]);

      setStats({
        totalUsers: usersRes.count || 0,
        totalAnalyses: analysesRes.count || 0,
        activeSubscriptions: subsRes.count || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchAnalyses = async () => {
    try {
      const { data: analysesData, error: analysesError } = await supabase
        .from('chart_analyses')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (analysesError) throw analysesError;

      // Fetch user emails separately
      const userIds = [...new Set(analysesData?.map(a => a.user_id).filter(Boolean))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, email')
        .in('id', userIds);

      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);
      
      const enrichedAnalyses = analysesData?.map(analysis => ({
        ...analysis,
        profiles: analysis.user_id ? profilesMap.get(analysis.user_id) || null : null
      })) || [];

      setAnalyses(enrichedAnalyses);
    } catch (error) {
      console.error('Error fetching analyses:', error);
      toast.error('Failed to load analyses');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('chart_analyses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Analysis deleted successfully');
      fetchAnalyses();
      fetchStats();
    } catch (error) {
      console.error('Error deleting analysis:', error);
      toast.error('Failed to delete analysis');
    }
  };

  const getSignalIcon = (signal: string) => {
    switch (signal) {
      case "BUY":
        return <TrendingUp className="h-4 w-4 text-bullish" />;
      case "SELL":
        return <TrendingDown className="h-4 w-4 text-bearish" />;
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading admin dashboard...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate("/")} size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-muted-foreground">Manage users and analyses</p>
            </div>
          </div>
          <Badge variant="destructive" className="text-lg px-4 py-2">Admin</Badge>
        </div>

        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{stats.totalUsers}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Analyses</p>
                <p className="text-2xl font-bold">{stats.totalAnalyses}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <CreditCard className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Subscriptions</p>
                <p className="text-2xl font-bold">{stats.activeSubscriptions}</p>
              </div>
            </div>
          </Card>
        </div>

        <Card className="p-6">
          <h2 className="text-xl font-bold mb-4">Recent Analyses</h2>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Signal</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Asset Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analyses.map((analysis) => (
                  <TableRow key={analysis.id}>
                    <TableCell className="font-medium">
                      {analysis.title || <span className="text-muted-foreground italic">Untitled</span>}
                    </TableCell>
                    <TableCell>{analysis.profiles?.email || 'Unknown'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getSignalIcon(analysis.signal)}
                        <span className="font-semibold">{analysis.signal}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{analysis.confidence}%</Badge>
                    </TableCell>
                    <TableCell className="capitalize">{analysis.asset_type}</TableCell>
                    <TableCell>{new Date(analysis.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Analysis</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this analysis? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(analysis.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </div>
  );
}
