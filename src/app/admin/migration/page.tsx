
"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { db, storage } from "@/lib/firebase";
import { collection, doc, setDoc, getDocs, writeBatch } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Rocket, CheckCircle, Database, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

// Initialize temporary Supabase client for reading
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function MigrationPage() {
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [step, setStep] = useState<"idle" | "tables" | "storage" | "done">("idle");

  function addLog(msg: string) {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} - ${msg}`]);
  }

  async function migrateTables() {
    setStep("tables");
    setLoading(true);
    addLog("Starting Database Migration...");

    const tables = ["portfolios", "media_releases", "site_settings", "inquiries", "users", "main_settings"];
    
    for (const tableName of tables) {
      addLog(`Reading table: ${tableName}...`);
      
      const { data: rows, error } = await supabase.from(tableName).select("*");
      
      if (error) {
        addLog(`Error reading ${tableName}: ${error.message}`);
        continue;
      }

      if (!rows || rows.length === 0) {
        addLog(`Table ${tableName} is empty.`);
        continue;
      }

      addLog(`Migrating ${rows.length} rows from ${tableName} to Firestore...`);
      
      // Batch write (monitor limits, Firestore batch is max 500)
      let batch = writeBatch(db);
      let count = 0;
      let totalMigrated = 0;

      for (const row of rows) {
        const docRef = doc(db, tableName, row.id.toString()); // Use ID as doc name
        batch.set(docRef, row);
        count++;

        if (count >= 400) {
          await batch.commit();
          totalMigrated += count;
          addLog(`  Committed batch of ${count} rows...`);
          batch = writeBatch(db);
          count = 0;
        }
      }

      if (count > 0) {
        await batch.commit();
        totalMigrated += count;
      }
      
      addLog(`Table ${tableName} done. (${totalMigrated} rows)`);
    }

    addLog("Database Migration Completed.");
    setLoading(false);
  }

  async function migrateStorage() {
    setStep("storage");
    setLoading(true);
    addLog("Starting Storage Migration (Images)...");

    const buckets = ["images", "og_images", "portfolio", "migration_uploads"]; // Added migration_uploads
    
    // Recursive function to handle folders
    const processFolder = async (bucketName: string, folderPath: string) => {
        const { data: files, error } = await supabase.storage.from(bucketName).list(folderPath, { limit: 100, offset: 0 });
        
        if (error) {
            addLog(`Error listing ${bucketName}/${folderPath}: ${error.message}`);
            return;
        }

        if (!files || files.length === 0) return;

        for (const file of files) {
            if (file.name === ".emptyFolderPlaceholder") continue;

            const fullPath = folderPath ? `${folderPath}/${file.name}` : file.name;

            // Check if it's a folder (Supabase returns null id for folders)
            if (!file.id) {
                addLog(`  Found folder: ${fullPath}, diving in...`);
                await processFolder(bucketName, fullPath);
                continue;
            }

            // It's a file, migrate it
            try {
                const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(fullPath);
                const sourceUrl = publicUrlData.publicUrl;

                const response = await fetch(sourceUrl);
                if (!response.ok) throw new Error(`Fetch failed (${response.status})`);
                const blob = await response.blob();
                
                const storageRef = ref(storage, `${bucketName}/${fullPath}`);
                await uploadBytes(storageRef, blob);
                
                addLog(`  Transferred: ${fullPath}`);
            } catch (e: any) {
                addLog(`  Failed to transfer ${fullPath}: ${e.message}`);
            }
        }
    };

    for (const bucketName of buckets) {
       addLog(`Processing bucket: ${bucketName}...`);
       await processFolder(bucketName, "");
    }
    
    addLog("Storage Migration Completed.");
    setLoading(false);
    setStep("done");
  }

  async function runFullMigration() {
      if(!confirm("Start migration to Firebase?")) return;
      setLogs([]);
      
      try {
          await migrateTables();
          await migrateStorage();
          toast.success("All Done!");
      } catch (e: any) {
          toast.error("Migration failed: " + e.message);
          addLog("CRITICAL ERROR: " + e.message);
      }
  }

  return (
    <div className="container mx-auto py-10 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8 flex items-center gap-2">
        <Rocket className="w-8 h-8 text-orange-500" />
        Supabase to Firebase Migration
      </h1>

      <div className="grid gap-6">
        <Card>
           <CardHeader>
             <CardTitle>Migration Console</CardTitle>
           </CardHeader>
           <CardContent>
              <div className="flex gap-4 mb-6">
                  <Button onClick={runFullMigration} disabled={loading || step === 'done'} className="w-full text-lg h-12">
                      {loading ? <Loader2 className="mr-2 animate-spin" /> : <Rocket className="mr-2" />}
                      Start Migration
                  </Button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className={`p-4 border rounded flex items-center gap-3 ${step === 'tables' ? 'bg-blue-50 border-blue-500' : ''} ${step === 'storage' || step === 'done' ? 'text-green-600 border-green-200 bg-green-50' : ''}`}>
                      <Database className="w-5 h-5" />
                      <div>
                          <div className="font-bold">1. Database</div>
                          <div className="text-sm">Tables → Firestore</div>
                      </div>
                      {(step === 'storage' || step === 'done') && <CheckCircle className="ml-auto w-5 h-5" />}
                  </div>
                  <div className={`p-4 border rounded flex items-center gap-3 ${step === 'storage' ? 'bg-blue-50 border-blue-500' : ''} ${step === 'done' ? 'text-green-600 border-green-200 bg-green-50' : ''}`}>
                      <ImageIcon className="w-5 h-5" />
                      <div>
                          <div className="font-bold">2. Storage</div>
                          <div className="text-sm">Buckets → Storage</div>
                      </div>
                      {step === 'done' && <CheckCircle className="ml-auto w-5 h-5" />}
                  </div>
              </div>

              <div className="bg-slate-950 text-slate-50 p-4 rounded-lg font-mono text-xs h-96 overflow-y-auto shadow-inner">
                  {logs.length === 0 && <div className="text-slate-500 italic">Ready to start...</div>}
                  {logs.map((log, i) => (
                      <div key={i} className="border-b border-slate-900 py-1">{log}</div>
                  ))}
                  <div id="log-end" />
              </div>
           </CardContent>
        </Card>
      </div>
    </div>
  );
}
