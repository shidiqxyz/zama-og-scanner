'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Search, X, ArrowUpDown } from 'lucide-react';
import type { TransactionFilters } from '@/types/transaction';

interface SearchFilterProps {
    filters: TransactionFilters;
    onFiltersChange: (filters: TransactionFilters) => void;
    itemsPerPage: number;
    onItemsPerPageChange: (value: number) => void;
}

export function SearchFilter({ filters, onFiltersChange, itemsPerPage, onItemsPerPageChange }: SearchFilterProps) {
    const updateFilter = (key: keyof TransactionFilters, value: string) => {
        onFiltersChange({
            ...filters,
            [key]: value,
        });
    };

    const clearFilters = () => {
        onFiltersChange({
            searchAddress: '',
            nftIdFilter: '',
            sortBy: 'timestamp',
            sortOrder: 'desc',
        });
    };

    const hasActiveFilters = filters.searchAddress;

    const toggleSortOrder = () => {
        onFiltersChange({
            ...filters,
            sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc',
        });
    };

    return (
        <div className="flex flex-col lg:flex-row gap-4 p-4 bg-zinc-900/50 rounded-lg border border-zinc-800">
            {/* Search by Address */}
            <div className="flex-1">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                    <Input
                        placeholder="Search by buyer address..."
                        value={filters.searchAddress || ''}
                        onChange={(e) => updateFilter('searchAddress', e.target.value)}
                        className="pl-10 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-zinc-500"
                    />
                </div>
            </div>

            {/* Sort By */}
            <div className="w-full lg:w-40">
                <Select
                    value={filters.sortBy}
                    onValueChange={(value) => updateFilter('sortBy', value as TransactionFilters['sortBy'])}
                >
                    <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                        <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 border-zinc-700">
                        <SelectItem value="timestamp" className="text-white hover:bg-zinc-700">
                            Time
                        </SelectItem>
                        <SelectItem value="amount" className="text-white hover:bg-zinc-700">
                            Amount
                        </SelectItem>
                        <SelectItem value="nftId" className="text-white hover:bg-zinc-700">
                            NFT ID
                        </SelectItem>
                        <SelectItem value="blockNumber" className="text-white hover:bg-zinc-700">
                            Block Number
                        </SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Sort Order Toggle */}
            <Button
                variant="outline"
                size="icon"
                onClick={toggleSortOrder}
                className="bg-zinc-800 border-zinc-700 text-white hover:bg-zinc-700"
                title={filters.sortOrder === 'asc' ? 'Ascending' : 'Descending'}
            >
                <ArrowUpDown className={`h-4 w-4 ${filters.sortOrder === 'asc' ? 'rotate-180' : ''}`} />
            </Button>

            {/* Per Page Selector */}
            <div className="w-full lg:w-32">
                <Select
                    value={itemsPerPage.toString()}
                    onValueChange={(value) => onItemsPerPageChange(parseInt(value))}
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

            {/* Clear Filters */}
            {hasActiveFilters && (
                <Button
                    variant="ghost"
                    onClick={clearFilters}
                    className="text-zinc-400 hover:text-white hover:bg-zinc-800"
                >
                    <X className="h-4 w-4 mr-2" />
                    Clear
                </Button>
            )}
        </div>
    );
}
