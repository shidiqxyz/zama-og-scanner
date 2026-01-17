'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, List, AlertCircle, Users, RefreshCw } from 'lucide-react';
import { ZAMA_CONTRACT_ADDRESS } from '@/lib/ethereum';
import { TransactionTable } from './transaction-table';
import { StatsPanel } from './stats-panel';
import { AddressLeaderboard } from './address-leaderboard';
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
            {/* Loading State */}
            {isLoadingData && !data && (
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardContent className="flex items-center justify-center py-16">
                        <div className="flex flex-col items-center gap-4">
                            <RefreshCw className="h-8 w-8 text-white animate-spin" />
                            <p className="text-zinc-400">Loading transactions from Etherscan...</p>
                        </div>
                    </CardContent>
                </Card>
            )}

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
                    <TabsList className="bg-zinc-900 border border-zinc-800">
                        <TabsTrigger
                            value="stats"
                            className="data-[state=active]:bg-white data-[state=active]:text-black"
                        >
                            <BarChart3 className="h-4 w-4 mr-2" />
                            Statistics
                        </TabsTrigger>
                        <TabsTrigger
                            value="transactions"
                            className="data-[state=active]:bg-white data-[state=active]:text-black"
                        >
                            <List className="h-4 w-4 mr-2" />
                            Transactions ({data.totalCount})
                        </TabsTrigger>
                        <TabsTrigger
                            value="addresses"
                            className="data-[state=active]:bg-white data-[state=active]:text-black"
                        >
                            <Users className="h-4 w-4 mr-2" />
                            Addresses ({data.statistics?.uniqueBuyers || 0})
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="stats" className="mt-6">
                        <StatsPanel statistics={data.statistics} isLoading={isLoadingData} />
                    </TabsContent>

                    <TabsContent value="transactions" className="mt-6">
                        <TransactionTable transactions={data.transactions} isLoading={isLoadingData} />
                    </TabsContent>

                    <TabsContent value="addresses" className="mt-6">
                        <AddressLeaderboard transactions={data.transactions} isLoading={isLoadingData} />
                    </TabsContent>
                </Tabs>
            )}
        </div>
    );
}
