'use client';

import { useState, useMemo } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Copy,
    ExternalLink,
    ChevronLeft,
    ChevronRight,
    Download,
    Check,
    Search,
} from 'lucide-react';
import {
    truncateAddress,
    formatWithCommas,
    formatTimestamp,
    getEtherscanAddressUrl,
} from '@/lib/ethereum';
import type { PurchaseTransaction } from '@/types/transaction';

interface AddressLeaderboardProps {
    transactions: PurchaseTransaction[];
    isLoading: boolean;
}

// ZAMA token price in USD
const ZAMA_PRICE_USD = 0.005;

interface BuyerData {
    address: string;
    totalZama: number;
    totalUsdt: number;
    transactionCount: number;
    lastPurchase: number; // timestamp
}

export function AddressLeaderboard({ transactions, isLoading }: AddressLeaderboardProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(50);
    const [searchAddress, setSearchAddress] = useState('');
    const [copiedItem, setCopiedItem] = useState<string | null>(null);

    // Aggregate transactions by buyer address
    const buyerData = useMemo(() => {
        const buyerMap = new Map<string, BuyerData>();

        for (const tx of transactions) {
            const address = tx.from.toLowerCase();
            const zamaAmount = parseFloat(tx.saleTokenAmountFormatted);

            const existing = buyerMap.get(address);
            if (existing) {
                existing.totalZama += zamaAmount;
                existing.totalUsdt += zamaAmount * ZAMA_PRICE_USD;
                existing.transactionCount++;
                // Update last purchase if this transaction is more recent
                if (tx.timestamp > existing.lastPurchase) {
                    existing.lastPurchase = tx.timestamp;
                }
            } else {
                buyerMap.set(address, {
                    address: tx.from, // Keep original case
                    totalZama: zamaAmount,
                    totalUsdt: zamaAmount * ZAMA_PRICE_USD,
                    transactionCount: 1,
                    lastPurchase: tx.timestamp,
                });
            }
        }

        // Sort by total ZAMA (descending)
        return Array.from(buyerMap.values()).sort((a, b) => b.totalZama - a.totalZama);
    }, [transactions]);

    // Filter by search
    const filteredBuyers = useMemo(() => {
        if (!searchAddress) return buyerData;
        const search = searchAddress.toLowerCase();
        return buyerData.filter((buyer) => buyer.address.toLowerCase().includes(search));
    }, [buyerData, searchAddress]);

    // Pagination
    const totalPages = Math.ceil(filteredBuyers.length / itemsPerPage);
    const paginatedBuyers = filteredBuyers.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const copyToClipboard = async (text: string, id: string) => {
        await navigator.clipboard.writeText(text);
        setCopiedItem(id);
        setTimeout(() => setCopiedItem(null), 2000);
    };

    const exportToCsv = () => {
        const headers = ['Rank', 'Address', 'Total ZAMA', 'Total USDT', 'Transactions', 'Last Purchase'];
        const rows = filteredBuyers.map((buyer, index) => [
            index + 1,
            buyer.address,
            Math.round(buyer.totalZama).toString(),
            Math.round(buyer.totalUsdt).toString(),
            buyer.transactionCount,
            formatTimestamp(buyer.lastPurchase),
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `zama-address-leaderboard-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    if (isLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-16 w-full bg-zinc-800" />
                <div className="border rounded-lg border-zinc-800">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-zinc-800 hover:bg-transparent">
                                {['Rank', 'Address', 'ZAMA', 'USDT', 'Txs', 'Last Purchase'].map((header) => (
                                    <TableHead key={header} className="text-zinc-400">
                                        {header}
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {[...Array(10)].map((_, i) => (
                                <TableRow key={i} className="border-zinc-800">
                                    {[...Array(6)].map((_, j) => (
                                        <TableCell key={j}>
                                            <Skeleton className="h-4 w-full bg-zinc-800" />
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Search and Controls */}
            <div className="flex flex-col lg:flex-row gap-4 p-4 bg-zinc-900/50 rounded-lg border border-zinc-800">
                {/* Search by Address */}
                <div className="flex-1">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                        <Input
                            placeholder="Search by address..."
                            value={searchAddress}
                            onChange={(e) => {
                                setSearchAddress(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="pl-10 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-zinc-500"
                        />
                    </div>
                </div>

                {/* Per Page Selector */}
                <div className="w-full lg:w-32">
                    <Select
                        value={itemsPerPage.toString()}
                        onValueChange={(value) => {
                            setItemsPerPage(parseInt(value));
                            setCurrentPage(1);
                        }}
                    >
                        <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                            <SelectValue placeholder="Per page" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-800 border-zinc-700">
                            <SelectItem value="20" className="text-white hover:bg-zinc-700">
                                20 / page
                            </SelectItem>
                            <SelectItem value="50" className="text-white hover:bg-zinc-700">
                                50 / page
                            </SelectItem>
                            <SelectItem value="100" className="text-white hover:bg-zinc-700">
                                100 / page
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Results summary and Export */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div className="text-sm text-zinc-400">
                    Showing{' '}
                    <span className="font-medium text-white">
                        {Math.min((currentPage - 1) * itemsPerPage + 1, filteredBuyers.length)}
                    </span>
                    {' - '}
                    <span className="font-medium text-white">
                        {Math.min(currentPage * itemsPerPage, filteredBuyers.length)}
                    </span>
                    {' of '}
                    <span className="font-medium text-white">{filteredBuyers.length}</span>
                    {' addresses'}
                    {searchAddress && (
                        <span className="text-zinc-500"> (filtered from {buyerData.length})</span>
                    )}
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={exportToCsv}
                    className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
                >
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                </Button>
            </div>

            {/* Table */}
            <div className="border rounded-lg border-zinc-800 overflow-hidden">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-zinc-800 hover:bg-transparent bg-zinc-900/50">
                                <TableHead className="text-zinc-400 w-20">Rank</TableHead>
                                <TableHead className="text-zinc-400">Address</TableHead>
                                <TableHead className="text-zinc-400 text-right">Total ZAMA</TableHead>
                                <TableHead className="text-zinc-400 text-right">Total USDT</TableHead>
                                <TableHead className="text-zinc-400 text-right">Txs</TableHead>
                                <TableHead className="text-zinc-400">Last Purchase</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedBuyers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-10 text-zinc-500">
                                        No addresses found matching your criteria
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedBuyers.map((buyer, index) => {
                                    // Calculate actual rank
                                    const rank = searchAddress
                                        ? buyerData.findIndex((b) => b.address.toLowerCase() === buyer.address.toLowerCase()) + 1
                                        : (currentPage - 1) * itemsPerPage + index + 1;

                                    return (
                                        <TableRow
                                            key={buyer.address}
                                            className="border-zinc-800 hover:bg-zinc-800/50 transition-colors"
                                        >
                                            <TableCell className="font-medium text-white">
                                                #{rank}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <a
                                                        href={getEtherscanAddressUrl(buyer.address)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="font-mono text-sm text-zinc-300 hover:text-white hover:underline"
                                                    >
                                                        {truncateAddress(buyer.address, 10, 8)}
                                                    </a>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6 text-zinc-500 hover:text-white"
                                                        onClick={() => copyToClipboard(buyer.address, buyer.address)}
                                                    >
                                                        {copiedItem === buyer.address ? (
                                                            <Check className="h-3 w-3 text-white" />
                                                        ) : (
                                                            <Copy className="h-3 w-3" />
                                                        )}
                                                    </Button>
                                                    <a
                                                        href={getEtherscanAddressUrl(buyer.address)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-zinc-500 hover:text-white"
                                                    >
                                                        <ExternalLink className="h-3 w-3" />
                                                    </a>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right font-medium text-white">
                                                {formatWithCommas(Math.round(buyer.totalZama).toString())}
                                            </TableCell>
                                            <TableCell className="text-right font-medium text-white">
                                                ${formatWithCommas(Math.round(buyer.totalUsdt).toString())}
                                            </TableCell>
                                            <TableCell className="text-right text-zinc-400">
                                                {buyer.transactionCount}
                                            </TableCell>
                                            <TableCell className="text-zinc-400 text-sm">
                                                {formatTimestamp(buyer.lastPurchase)}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-sm text-zinc-500 order-2 sm:order-1">
                        Page {currentPage} of {totalPages}
                    </div>
                    <div className="flex items-center gap-2 order-1 sm:order-2 w-full sm:w-auto justify-between sm:justify-end">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700 disabled:opacity-50"
                        >
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Previous
                        </Button>
                        <div className="hidden sm:flex items-center gap-1">
                            {[...Array(Math.min(5, totalPages))].map((_, i) => {
                                let pageNum: number;
                                if (totalPages <= 5) {
                                    pageNum = i + 1;
                                } else if (currentPage <= 3) {
                                    pageNum = i + 1;
                                } else if (currentPage >= totalPages - 2) {
                                    pageNum = totalPages - 4 + i;
                                } else {
                                    pageNum = currentPage - 2 + i;
                                }
                                return (
                                    <Button
                                        key={pageNum}
                                        variant={currentPage === pageNum ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => setCurrentPage(pageNum)}
                                        className={
                                            currentPage === pageNum
                                                ? 'bg-white hover:bg-zinc-200 text-black'
                                                : 'bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700'
                                        }
                                    >
                                        {pageNum}
                                    </Button>
                                );
                            })}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700 disabled:opacity-50"
                        >
                            Next
                            <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
