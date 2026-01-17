'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Users, ShoppingCart, Coins, Trophy, DollarSign } from 'lucide-react';
import { truncateAddress, formatWithCommas, getEtherscanAddressUrl } from '@/lib/ethereum';
import type { ScanStatistics } from '@/types/transaction';

interface StatsPanelProps {
    statistics: ScanStatistics | null;
    isLoading: boolean;
}

// ZAMA token price in USD
const ZAMA_PRICE_USD = 0.005;

export function StatsPanel({ statistics, isLoading }: StatsPanelProps) {
    const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

    const copyToClipboard = async (address: string) => {
        await navigator.clipboard.writeText(address);
        setCopiedAddress(address);
        setTimeout(() => setCopiedAddress(null), 2000);
    };

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[...Array(4)].map((_, i) => (
                    <Card key={i} className="bg-zinc-900 border-zinc-800">
                        <CardHeader className="pb-2">
                            <Skeleton className="h-4 w-24 bg-zinc-800" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-8 w-32 bg-zinc-800" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    if (!statistics) {
        return null;
    }

    // Calculate values
    // saleTokenAmount = ZAMA tokens sold
    const totalZama = parseFloat(statistics.totalSaleTokenAmount);
    // USDT = ZAMA × $0.005
    const totalUsdt = totalZama * ZAMA_PRICE_USD;

    const stats = [
        {
            title: 'Total Transactions',
            value: statistics.totalTransactions.toLocaleString(),
            icon: ShoppingCart,
        },
        {
            title: 'Unique Buyers',
            value: statistics.uniqueBuyers.toLocaleString(),
            icon: Users,
        },
        {
            title: 'Total NFTs Sold',
            value: statistics.totalNftsSold.toLocaleString(),
            icon: Coins,
        },
        {
            title: 'Total ZAMA Sold',
            value: formatWithCommas(Math.round(totalZama).toString()),
            icon: Trophy,
            suffix: 'ZAMA',
        },
        {
            title: 'Total USDT',
            value: `$${formatWithCommas(Math.round(totalUsdt).toString())}`,
            icon: DollarSign,
        },
    ];

    return (
        <div className="space-y-6">
            {/* Main Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                {stats.map((stat) => (
                    <Card
                        key={stat.title}
                        className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors"
                    >
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-zinc-400">
                                {stat.title}
                            </CardTitle>
                            <div className="p-2 rounded-lg bg-zinc-800">
                                <stat.icon className="h-4 w-4 text-white" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-white">
                                {stat.value}
                                {stat.suffix && (
                                    <span className="text-sm font-normal text-zinc-500 ml-2">
                                        {stat.suffix}
                                    </span>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Top Buyers */}
            {statistics.topBuyers.length > 0 && (
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2 text-white">
                            <Trophy className="h-5 w-5 text-white" />
                            Top 5 Buyers
                        </CardTitle>
                        <CardDescription className="text-zinc-500">Ranked by total ZAMA purchased</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {statistics.topBuyers.map((buyer, index) => {
                                const buyerZama = parseFloat(buyer.totalAmount);
                                const buyerUsdt = buyerZama * ZAMA_PRICE_USD;
                                return (
                                    <div
                                        key={buyer.address}
                                        className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Badge
                                                variant="outline"
                                                className="bg-zinc-800 text-white border-zinc-700"
                                            >
                                                #{index + 1}
                                            </Badge>
                                            <div>
                                                <button
                                                    onClick={() => copyToClipboard(buyer.address)}
                                                    className="font-mono text-sm text-zinc-300 hover:text-white transition-colors"
                                                    title={copiedAddress === buyer.address ? 'Copied!' : 'Click to copy'}
                                                >
                                                    {buyer.ensName || truncateAddress(buyer.address)}
                                                </button>
                                                <a
                                                    href={getEtherscanAddressUrl(buyer.address)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-xs text-zinc-500 hover:text-zinc-300 ml-2"
                                                >
                                                    ↗
                                                </a>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-medium text-white">
                                                {formatWithCommas(Math.round(buyerZama).toString())} ZAMA
                                            </div>
                                            <div className="text-xs text-zinc-500">
                                                ${formatWithCommas(Math.round(buyerUsdt).toString())} USDT
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
