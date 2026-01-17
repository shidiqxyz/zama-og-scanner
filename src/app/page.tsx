'use client';

import { ScannerDashboard } from "@/components/scanner/scanner-dashboard";

export default function Home() {
  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-black sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center">
            <div className="flex items-center gap-3">
              {/* Zama Logo */}
              <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center">
                <span className="text-black font-bold text-lg">Z</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Zama Scanner</h1>
                <p className="text-xs text-zinc-500">Community Sale NFT Tracker</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <ScannerDashboard />
      </main>
    </div>
  );
}
