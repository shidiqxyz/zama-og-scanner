'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, List, AlertCircle, Users } from 'lucide-react';
import { ZAMA_CONTRACT_ADDRESS } from '@/lib/ethereum';
import { TransactionTable } from './transaction-table';
import { StatsPanel } from './stats-panel';
import { AddressLeaderboard } from './address-leaderboard';
import { UnusedNftList } from './unused-nft-list';
import type { PurchaseTransaction, ScanStatistics } from '@/types/transaction';

interface ScanResponse {
    success: boolean;
    transactions: PurchaseTransaction[];
    totalCount: number;
    statistics: ScanStatistics | null;
    error?: string;
}

export function ScannerDashboard() {
    const {
        data,
        isLoading,
        isFetching,
        error,
        refetch,
    } = useQuery<ScanResponse>({
        queryKey: ['transactions', ZAMA_CONTRACT_ADDRESS],
        queryFn: async () => {
            const response = await fetch(`/api/scan?contractAddress=${ZAMA_CONTRACT_ADDRESS}`);
            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || 'Failed to fetch transactions');
            }

            return result;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    // Auto-scan on component mount
    useEffect(() => {
        refetch();
    }, [refetch]);

    const isLoadingData = isLoading || isFetching;

    return (
        <div className="space-y-6">

            {/* Error State */}
            {error && (
                <Card className="bg-zinc-900 border-zinc-700">
                    <CardContent className="flex items-center gap-3 py-4">
                        <AlertCircle className="h-5 w-5 text-white" />
                        <div>
                            <p className="text-white font-medium">Error scanning transactions</p>
                            <p className="text-zinc-400 text-sm">
                                {error instanceof Error ? error.message : 'Unknown error occurred'}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Results */}
            {data && (
                <Tabs defaultValue="stats" className="space-y-6">
                    <TabsList className="w-full bg-zinc-900 border border-zinc-800 h-auto p-1 grid grid-cols-2 md:grid-cols-4 gap-1">
                        <TabsTrigger
                            value="stats"
                            className="data-[state=active]:bg-white data-[state=active]:text-black h-auto py-2 sm:py-1.5 flex flex-col sm:flex-row gap-1 sm:gap-2"
                        >
                            <BarChart3 className="h-4 w-4" />
                            <span className="text-[10px] sm:text-sm font-medium">Statistics</span>
                        </TabsTrigger>
                        <TabsTrigger
                            value="transactions"
                            className="data-[state=active]:bg-white data-[state=active]:text-black h-auto py-2 sm:py-1.5 flex flex-col sm:flex-row gap-1 sm:gap-2"
                        >
                            <List className="h-4 w-4" />
                            <div className="flex flex-col sm:flex-row sm:gap-1 items-center">
                                <span className="text-[10px] sm:text-sm font-medium">Transactions</span>
                                <span className="text-[10px] sm:text-sm opacity-70 hidden sm:inline">({data.totalCount})</span>
                            </div>
                        </TabsTrigger>
                        <TabsTrigger
                            value="leaderboard"
                            className="data-[state=active]:bg-white data-[state=active]:text-black h-auto py-2 sm:py-1.5 flex flex-col sm:flex-row gap-1 sm:gap-2"
                        >
                            <Users className="h-4 w-4" />
                            <div className="flex flex-col sm:flex-row sm:gap-1 items-center">
                                <span className="text-[10px] sm:text-sm font-medium">Leaderboard</span>
                                <span className="text-[10px] sm:text-sm opacity-70 hidden sm:inline">({data.statistics?.uniqueBuyers || 0})</span>
                            </div>
                        </TabsTrigger>
                        <TabsTrigger
                            value="unused"
                            className="data-[state=active]:bg-white data-[state=active]:text-black h-auto py-2 sm:py-1.5 flex flex-col sm:flex-row gap-1 sm:gap-2"
                        >
                            <AlertCircle className="h-4 w-4" />
                            <span className="text-[10px] sm:text-sm font-medium">Not Participated</span>
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="stats" className="mt-6">
                        <StatsPanel statistics={data.statistics} isLoading={isLoadingData} />
                    </TabsContent>

                    <TabsContent value="transactions" className="mt-6">
                        <TransactionTable transactions={data.transactions} isLoading={isLoadingData} />
                    </TabsContent>

                    <TabsContent value="leaderboard" className="mt-6">
                        <AddressLeaderboard transactions={data.transactions} isLoading={isLoadingData} />
                    </TabsContent>

                    <TabsContent value="unused" className="mt-6">
                        <UnusedNftList transactions={data.transactions} isLoading={isLoadingData} />
                    </TabsContent>
                </Tabs>
            )}
        </div>
    );
}
