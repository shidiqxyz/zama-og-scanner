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
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Copy,
    ExternalLink,
    ChevronLeft,
    ChevronRight,
    Download,
    Check
} from 'lucide-react';
import {
    truncateAddress,
    formatWithCommas,
    formatTimestamp,
    getEtherscanTxUrl,
    getEtherscanAddressUrl,
} from '@/lib/ethereum';
import type { PurchaseTransaction, TransactionFilters } from '@/types/transaction';
import { SearchFilter } from './search-filter';

interface TransactionTableProps {
    transactions: PurchaseTransaction[];
    isLoading: boolean;
}

// ZAMA token price in USD
const ZAMA_PRICE_USD = 0.005;

export function TransactionTable({ transactions, isLoading }: TransactionTableProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);
    const [copiedItem, setCopiedItem] = useState<string | null>(null);
    const [filters, setFilters] = useState<TransactionFilters>({
        searchAddress: '',
        nftIdFilter: '',
        sortBy: 'timestamp',
        sortOrder: 'desc',
    });

    // Filter and sort transactions
    const filteredTransactions = useMemo(() => {
        let result = [...transactions];

        // Apply address search filter
        if (filters.searchAddress) {
            const search = filters.searchAddress.toLowerCase();
            result = result.filter((tx) => tx.from.toLowerCase().includes(search));
        }

        // Apply sorting
        result.sort((a, b) => {
            let comparison = 0;
            switch (filters.sortBy) {
                case 'timestamp':
                    comparison = a.timestamp - b.timestamp;
                    break;
                case 'amount':
                    comparison = BigInt(a.saleTokenAmount) > BigInt(b.saleTokenAmount) ? 1 : -1;
                    break;
                case 'nftId':
                    comparison = parseInt(a.nftId) - parseInt(b.nftId);
                    break;
                case 'blockNumber':
                    comparison = a.blockNumber - b.blockNumber;
                    break;
            }
            return filters.sortOrder === 'asc' ? comparison : -comparison;
        });

        return result;
    }, [transactions, filters]);

    // Pagination
    const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
    const paginatedTransactions = filteredTransactions.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Reset to page 1 when filters change
    const handleFiltersChange = (newFilters: TransactionFilters) => {
        setFilters(newFilters);
        setCurrentPage(1);
    };

    // Handle items per page change
    const handleItemsPerPageChange = (value: number) => {
        setItemsPerPage(value);
        setCurrentPage(1);
    };

    const copyToClipboard = async (text: string, id: string) => {
        await navigator.clipboard.writeText(text);
        setCopiedItem(id);
        setTimeout(() => setCopiedItem(null), 2000);
    };

    const exportToCsv = () => {
        const headers = ['No', 'Transaction Hash', 'Buyer Address', 'NFT ID', 'ZAMA Amount', 'USDT Amount', 'Timestamp', 'Block Number'];
        const rows = filteredTransactions.map((tx, index) => {
            const zamaAmount = parseFloat(tx.saleTokenAmountFormatted);
            const usdtAmount = zamaAmount * ZAMA_PRICE_USD;
            return [
                index + 1,
                tx.hash,
                tx.from,
                tx.nftId,
                Math.round(zamaAmount).toString(),
                Math.round(usdtAmount).toString(),
                formatTimestamp(tx.timestamp),
                tx.blockNumber,
            ];
        });

        const csvContent = [
            headers.join(','),
            ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `zama-community-sale-transactions-${new Date().toISOString().split('T')[0]}.csv`;
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
                                {['No', 'Tx Hash', 'Buyer', 'NFT ID', 'ZAMA', 'USDT', 'Time', 'Block'].map((header) => (
                                    <TableHead key={header} className="text-zinc-400">
                                        {header}
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {[...Array(10)].map((_, i) => (
                                <TableRow key={i} className="border-zinc-800">
                                    {[...Array(8)].map((_, j) => (
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
            {/* Search and Filters */}
            <SearchFilter
                filters={filters}
                onFiltersChange={handleFiltersChange}
                itemsPerPage={itemsPerPage}
                onItemsPerPageChange={handleItemsPerPageChange}
            />

            {/* Results summary and Export */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div className="text-sm text-zinc-400">
                    Showing{' '}
                    <span className="font-medium text-white">
                        {Math.min((currentPage - 1) * itemsPerPage + 1, filteredTransactions.length)}
                    </span>
                    {' - '}
                    <span className="font-medium text-white">
                        {Math.min(currentPage * itemsPerPage, filteredTransactions.length)}
                    </span>
                    {' of '}
                    <span className="font-medium text-white">{filteredTransactions.length}</span>
                    {' transactions'}
                    {filters.searchAddress && (
                        <span className="text-zinc-500"> (filtered from {transactions.length})</span>
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
                                <TableHead className="text-zinc-400 w-16">No</TableHead>
                                <TableHead className="text-zinc-400">Transaction Hash</TableHead>
                                <TableHead className="text-zinc-400">Buyer Address</TableHead>
                                <TableHead className="text-zinc-400 text-center">NFT ID</TableHead>
                                <TableHead className="text-zinc-400 text-right">ZAMA</TableHead>
                                <TableHead className="text-zinc-400 text-right">USDT</TableHead>
                                <TableHead className="text-zinc-400">Timestamp</TableHead>
                                <TableHead className="text-zinc-400 text-right">Block</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {paginatedTransactions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-10 text-zinc-500">
                                        No transactions found matching your criteria
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedTransactions.map((tx, index) => {
                                    const zamaAmount = parseFloat(tx.saleTokenAmountFormatted);
                                    const usdtAmount = zamaAmount * ZAMA_PRICE_USD;
                                    return (
                                        <TableRow
                                            key={tx.hash}
                                            className="border-zinc-800 hover:bg-zinc-800/50 transition-colors"
                                        >
                                            <TableCell className="font-medium text-zinc-400">
                                                {(currentPage - 1) * itemsPerPage + index + 1}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <a
                                                        href={getEtherscanTxUrl(tx.hash)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="font-mono text-sm text-zinc-300 hover:text-white hover:underline"
                                                    >
                                                        {truncateAddress(tx.hash, 8, 6)}
                                                    </a>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6 text-zinc-500 hover:text-white"
                                                        onClick={() => copyToClipboard(tx.hash, `hash-${tx.hash}`)}
                                                    >
                                                        {copiedItem === `hash-${tx.hash}` ? (
                                                            <Check className="h-3 w-3 text-white" />
                                                        ) : (
                                                            <Copy className="h-3 w-3" />
                                                        )}
                                                    </Button>
                                                    <a
                                                        href={getEtherscanTxUrl(tx.hash)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-zinc-500 hover:text-white"
                                                    >
                                                        <ExternalLink className="h-3 w-3" />
                                                    </a>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <a
                                                        href={getEtherscanAddressUrl(tx.from)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="font-mono text-sm text-zinc-300 hover:text-white hover:underline"
                                                    >
                                                        {tx.ensName || truncateAddress(tx.from)}
                                                    </a>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6 text-zinc-500 hover:text-white"
                                                        onClick={() => copyToClipboard(tx.from, `from-${tx.hash}`)}
                                                    >
                                                        {copiedItem === `from-${tx.hash}` ? (
                                                            <Check className="h-3 w-3 text-white" />
                                                        ) : (
                                                            <Copy className="h-3 w-3" />
                                                        )}
                                                    </Button>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge
                                                    variant="outline"
                                                    className="bg-zinc-800 text-white border-zinc-700"
                                                >
                                                    #{tx.nftId}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-medium text-white">
                                                {formatWithCommas(Math.round(zamaAmount).toString())}
                                            </TableCell>
                                            <TableCell className="text-right font-medium text-white">
                                                ${formatWithCommas(Math.round(usdtAmount).toString())}
                                            </TableCell>
                                            <TableCell className="text-zinc-400 text-sm">
                                                {formatTimestamp(tx.timestamp)}
                                            </TableCell>
                                            <TableCell className="text-right text-zinc-400 font-mono text-sm">
                                                {tx.blockNumber.toLocaleString()}
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
