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
    ChevronLeft,
    ChevronRight,
    Download,
    Search,
    AlertCircle
} from 'lucide-react';
import type { PurchaseTransaction } from '@/types/transaction';
import { Card, CardContent } from '@/components/ui/card';

interface UnusedNftListProps {
    transactions: PurchaseTransaction[];
    isLoading: boolean;
}

const MAX_NFT_ID = 5500;

export function UnusedNftList({ transactions, isLoading }: UnusedNftListProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(100);
    const [searchId, setSearchId] = useState('');

    // Calculate unused IDs
    const unusedIds = useMemo(() => {
        if (isLoading) return [];

        const usedIds = new Set<number>();
        transactions.forEach(tx => {
            const id = parseInt(tx.nftId);
            if (!isNaN(id)) {
                usedIds.add(id);
            }
        });

        const unused: number[] = [];
        for (let i = 1; i <= MAX_NFT_ID; i++) {
            if (!usedIds.has(i)) {
                unused.push(i);
            }
        }

        return unused;
    }, [transactions, isLoading]);

    // Filter by search
    const filteredIds = useMemo(() => {
        if (!searchId) return unusedIds;
        return unusedIds.filter(id => id.toString().includes(searchId));
    }, [unusedIds, searchId]);

    // Pagination
    const totalPages = Math.ceil(filteredIds.length / itemsPerPage);
    const paginatedIds = filteredIds.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const exportToCsv = () => {
        const headers = ['NFT ID', 'Status'];
        const rows = filteredIds.map(id => [id.toString(), 'Available']);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `zama-unused-nfts-${new Date().toISOString().split('T')[0]}.csv`;
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
                                <TableHead className="text-zinc-400">NFT ID</TableHead>
                                <TableHead className="text-zinc-400">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {[...Array(10)].map((_, i) => (
                                <TableRow key={i} className="border-zinc-800">
                                    <TableCell><Skeleton className="h-4 w-20 bg-zinc-800" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-24 bg-zinc-800" /></TableCell>
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
            {/* Summary Card */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardContent className="p-4 flex flex-col gap-1">
                        <span className="text-zinc-500 text-sm">Total Supply</span>
                        <span className="text-2xl font-bold text-white">{MAX_NFT_ID}</span>
                    </CardContent>
                </Card>
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardContent className="p-4 flex flex-col gap-1">
                        <span className="text-zinc-500 text-sm">Participated (Used)</span>
                        <span className="text-2xl font-bold text-emerald-400">
                            {MAX_NFT_ID - unusedIds.length}
                        </span>
                    </CardContent>
                </Card>
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardContent className="p-4 flex flex-col gap-1">
                        <span className="text-zinc-500 text-sm">Not Participated (Available)</span>
                        <span className="text-2xl font-bold text-amber-400">
                            {unusedIds.length}
                        </span>
                    </CardContent>
                </Card>
            </div>

            {/* Search and Controls */}
            <div className="flex flex-col lg:flex-row gap-4 p-4 bg-zinc-900/50 rounded-lg border border-zinc-800">
                <div className="flex-1">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                        <Input
                            placeholder="Search NFT ID..."
                            value={searchId}
                            onChange={(e) => {
                                setSearchId(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="pl-10 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-zinc-500"
                            type="number"
                        />
                    </div>
                </div>

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
                            <SelectItem value="50" className="text-white hover:bg-zinc-700">50 / page</SelectItem>
                            <SelectItem value="100" className="text-white hover:bg-zinc-700">100 / page</SelectItem>
                            <SelectItem value="200" className="text-white hover:bg-zinc-700">200 / page</SelectItem>
                            <SelectItem value="500" className="text-white hover:bg-zinc-700">500 / page</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Results summary and Export */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div className="text-sm text-zinc-400">
                    Showing <span className="font-medium text-white">{Math.min((currentPage - 1) * itemsPerPage + 1, filteredIds.length)}</span> - <span className="font-medium text-white">{Math.min(currentPage * itemsPerPage, filteredIds.length)}</span> of <span className="font-medium text-white">{filteredIds.length}</span> IDs
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

            {/* Grid for IDs */}
            <div className="border rounded-lg border-zinc-800 bg-zinc-900/50 p-4">
                {paginatedIds.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-zinc-500 gap-2">
                        <AlertCircle className="h-8 w-8 opacity-50" />
                        <p>No unused IDs found matching your search</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2">
                        {paginatedIds.map((id) => (
                            <a
                                key={id}
                                href={`https://opensea.io/item/ethereum/0xb3f2ddaed136cf10d5b228ee2eff29b71c7535fc/${id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-zinc-800/50 hover:bg-zinc-700/50 hover:border-zinc-600 border border-zinc-700/50 rounded p-2 text-center text-sm text-zinc-300 hover:text-white font-mono transition-all block"
                            >
                                #{id}
                            </a>
                        ))}
                    </div>
                )}
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
