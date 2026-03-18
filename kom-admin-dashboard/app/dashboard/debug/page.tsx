"use client";

import { useEffect, useState } from "react";

export default function DebugPage() {
  const [apiBaseUrl, setApiBaseUrl] = useState<string>("");
  const [testResult, setTestResult] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check what API base URL is being used
    const url = process.env.NEXT_PUBLIC_API_BASE_URL || "NOT SET";
    setApiBaseUrl(url);
    
    console.log("🔍 Debug Info:");
    console.log("NEXT_PUBLIC_API_BASE_URL:", url);
    console.log("window.location:", window.location.href);
  }, []);

  const testAPI = async () => {
    setLoading(true);
    setTestResult("جاري الاختبار...");
    
    try {
      // Import api dynamically
      const { default: api } = await import("../../../lib/api");
      
      const response = await fetch(api.defaults.baseURL + "/health", {
        method: "GET",
      });
      
      const data = await response.json();
      
      setTestResult(JSON.stringify({
        status: response.status,
        baseURL: api.defaults.baseURL,
        response: data,
      }, null, 2));
    } catch (error: any) {
      setTestResult(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-bold">🔍 صفحة Debug</h1>
      
      <div className="bg-white rounded-lg p-6 shadow space-y-4">
        <div>
          <h2 className="text-xl font-semibold mb-2">Environment Variables</h2>
          <div className="bg-gray-100 p-4 rounded font-mono text-sm">
            <div>
              <strong>NEXT_PUBLIC_API_BASE_URL:</strong> {apiBaseUrl}
            </div>
          </div>
        </div>
        
        <div>
          <h2 className="text-xl font-semibold mb-2">اختبار الاتصال بالباكند</h2>
          <button
            onClick={testAPI}
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded disabled:opacity-50"
          >
            {loading ? "جاري الاختبار..." : "اختبار API"}
          </button>
          
          {testResult && (
            <pre className="bg-gray-100 p-4 rounded mt-4 text-xs overflow-auto max-h-96">
              {testResult}
            </pre>
          )}
        </div>
      </div>
      
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
        <p className="text-sm">
          <strong>ملاحظة:</strong> إذا كان NEXT_PUBLIC_API_BASE_URL يعرض "NOT SET" أو "http://localhost:3002"، 
          فهذا يعني أن الأدمن لا يتصل بالباكند الصحيح على Production.
        </p>
      </div>
    </div>
  );
}
