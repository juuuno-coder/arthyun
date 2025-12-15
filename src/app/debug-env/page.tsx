"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, limit, query } from "firebase/firestore";

export default function DebugEnvPage() {
  const [status, setStatus] = useState<any>({});
  const [dbStatus, setDbStatus] = useState("Checking DB...");

  useEffect(() => {
    // Check Env Vars (Client Side)
    setStatus({
      API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? "Present" : "MISSING",
      PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ? "Present" : "MISSING",
      STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ? "Present" : "MISSING",
    });

    // Test DB Connection
    async function testDB() {
      try {
        const q = query(collection(db, "main_settings"), limit(1));
        const snap = await getDocs(q);
        setDbStatus(`Success! Found ${snap.size} docs.`);
      } catch (e: any) {
        setDbStatus(`Error: ${e.message}`);
        console.error(e);
      }
    }
    testDB();
  }, []);

  return (
    <div className="p-10 bg-white text-black">
      <h1 className="text-2xl font-bold mb-4">Environment Debugger</h1>
      <pre className="bg-gray-100 p-4 rounded mb-4">
        {JSON.stringify(status, null, 2)}
      </pre>
      <h2 className="text-xl font-bold mb-2">DB Connection Test</h2>
      <p className={(dbStatus.startsWith("Error") || dbStatus.includes("MISSING")) ? "text-red-600 font-bold" : "text-green-600 font-bold"}>
        {dbStatus}
      </p>
      
      <p className="mt-8 text-sm text-gray-500">
        If MISSING, go to Vercel Settings {'>'} Environment Variables and add them.
      </p>
    </div>
  );
}
