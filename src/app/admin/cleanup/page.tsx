
"use client";

import { useState, useEffect } from "react";
import { getCleanupStats, performCleanup } from "@/actions/cleanupActions";
import { backupDatabase } from "@/actions/backupActions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Download, Trash2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export default function CleanupPage() {
  const [loading, setLoading] = useState(true);
  const [cleaning, setCleaning] = useState(false);
  const [backingUp, setBackingUp] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [backupDone, setBackupDone] = useState(false);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      setLoading(true);
      const data = await getCleanupStats();
      setStats(data);
    } catch (e) {
      toast.error("Failed to load stats");
    } finally {
      setLoading(false);
    }
  }

  async function handleBackup() {
      setBackingUp(true);
      try {
          const result = await backupDatabase();
          if (result.success) {
              // Trigger download
              const blob = new Blob([result.data], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `arthyun_backup_${new Date().toISOString().split('T')[0]}.json`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
              
              toast.success("Backup downloaded successfully");
              setLogs(prev => [...prev, ...result.logs]);
              setBackupDone(true);
          }
      } catch (e: any) {
          toast.error("Backup failed: " + e.message);
      } finally {
          setBackingUp(false);
      }
  }

  async function handleCleanup() {
    if (!backupDone) {
        if (!confirm("백업을 하지 않았습니다! 그래도 삭제하시겠습니까?")) return;
    } else {
        if (!confirm("정말로 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) return;
    }
    
    setCleaning(true);
    setLogs([]);
    try {
      const result = await performCleanup();
      setLogs(result.logs);
      toast.success("Cleanup process finished");
      loadStats(); // Refresh stats
    } catch (e) {
      toast.error("Cleanup failed");
    } finally {
      setCleaning(false);
    }
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8">System Maintenance</h1>
      
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-green-600" />
                Step 1: Data Backup
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">
                Before deleting anything, please download a snapshot of your current critical data (Portfolios, Settings, etc.).
                <br />This will save a JSON file to your computer.
            </p>
            <Button onClick={handleBackup} disabled={backingUp} variant="outline" className="gap-2">
                {backingUp ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                {backingUp ? "Backing up..." : "Download Data Snapshot"}
            </Button>
          </CardContent>
        </Card>

        <Card className={!backupDone ? "opacity-50" : ""}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
                <Trash2 className="w-5 h-5" />
                Step 2: Clean Migration Artifacts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center gap-2">
                 <Loader2 className="animate-spin" /> Checking...
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded">
                        <div className="text-sm text-muted-foreground">Database Table</div>
                        <div className="text-lg font-bold">{stats?.tableName}</div>
                        <div className="text-2xl mt-2">{stats?.tableCount} rows</div>
                    </div>
                    <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded">
                        <div className="text-sm text-muted-foreground">Storage Bucket</div>
                        <div className="text-lg font-bold">{stats?.bucketName}</div>
                        <div className="text-2xl mt-2">
                            {stats?.fileCountSample >= 100 ? "100+" : stats?.fileCountSample} files in root
                        </div>
                        {stats?.storageError && (
                            <div className="text-red-500 text-sm mt-1">{stats.storageError}</div>
                        )}
                    </div>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/30 p-4 rounded text-sm text-yellow-800 dark:text-yellow-200">
                    Warning: This will permanently delete the <strong>migrated_posts</strong> table and files in the <strong>migration_uploads</strong> bucket.
                </div>

                <Button 
                    variant="destructive" 
                    onClick={handleCleanup} 
                    disabled={cleaning || (stats?.tableCount === 0 && stats?.fileCountSample === 0)}
                >
                    {cleaning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {cleaning ? "Cleaning..." : "Delete All Backup Data"}
                </Button>

                {logs.length > 0 && (
                    <div className="mt-4 p-4 bg-black text-white rounded text-xs font-mono max-h-60 overflow-y-auto">
                        {logs.map((log, i) => (
                            <div key={i}>{log}</div>
                        ))}
                    </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
