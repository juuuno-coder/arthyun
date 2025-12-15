"use client";

import { useEffect, useState } from "react";

export default function DebugPage() {
    const [envStatus, setEnvStatus] = useState<any>(null);

    useEffect(() => {
        const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
        const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
        const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

        setEnvStatus({
            apiKey: apiKey ? `${apiKey.substring(0, 5)}... (${apiKey.length} chars)` : "UNDEFINED",
            authDomain: authDomain || "UNDEFINED",
            projectId: projectId || "UNDEFINED",
            appUrl: process.env.NEXT_PUBLIC_APP_URL || "UNDEFINED"
        });
    }, []);

    if (!envStatus) return <div>Checking Env Vars...</div>;

    return (
        <div className="p-10 font-mono text-sm max-w-2xl mx-auto border m-10 bg-gray-50">
            <h1 className="text-xl font-bold mb-4">Environment Variable Debugger</h1>
            
            <div className="space-y-2">
                <div className="flex justify-between border-b pb-1">
                    <span>NEXT_PUBLIC_FIREBASE_API_KEY:</span>
                    <span className={envStatus.apiKey === "UNDEFINED" ? "text-red-600 font-bold" : "text-green-600 font-bold"}>
                        {envStatus.apiKey}
                    </span>
                </div>
                <div className="flex justify-between border-b pb-1">
                    <span>NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:</span>
                    <span className={envStatus.authDomain === "UNDEFINED" ? "text-red-600 font-bold" : "text-green-600 font-bold"}>
                        {envStatus.authDomain}
                    </span>
                </div>
                <div className="flex justify-between border-b pb-1">
                    <span>NEXT_PUBLIC_FIREBASE_PROJECT_ID:</span>
                    <span className={envStatus.projectId === "UNDEFINED" ? "text-red-600 font-bold" : "text-green-600 font-bold"}>
                        {envStatus.projectId}
                    </span>
                </div>
                <div className="flex justify-between border-b pb-1">
                    <span>NEXT_PUBLIC_APP_URL:</span>
                    <span>{envStatus.appUrl}</span>
                </div>
            </div>

            <p className="mt-8 text-gray-500">
                If any value is <span className="text-red-600">UNDEFINED</span>, you must add it to Vercel Environment Variables and REDEPLOY.
            </p>
        </div>
    );
}
