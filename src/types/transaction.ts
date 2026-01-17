/**
 * Zama Community Sale NFT Scanner - Transaction Types
 */

// Decoded purchase transaction data
export interface PurchaseTransaction {
    // Transaction identifiers
    hash: string;
    blockNumber: number;
    timestamp: number;

    // Transaction participants
    from: string; // Buyer address
    to: string; // Contract address

    // Decoded purchase data
    nftId: string; // uint256 as string to handle BigInt
    saleTokenAmount: string; // uint256 as string
    saleTokenAmountFormatted: string; // Human readable with decimals

    // Optional ENS name
    ensName?: string;
}

// API response structure
export interface ScanResult {
    success: boolean;
    transactions: PurchaseTransaction[];
    totalCount: number;
    error?: string;
}

// Filter and sort options
export interface TransactionFilters {
    searchAddress?: string;
    nftIdFilter?: string;
    sortBy: 'timestamp' | 'amount' | 'nftId' | 'blockNumber';
    sortOrder: 'asc' | 'desc';
}

// Statistics data
export interface ScanStatistics {
    totalTransactions: number;
    uniqueBuyers: number;
    totalNftsSold: number;
    totalSaleTokenAmount: string;
    topBuyers: {
        address: string;
        ensName?: string;
        totalAmount: string;
        transactionCount: number;
    }[];
}

// Etherscan API response types
export interface EtherscanTransaction {
    blockNumber: string;
    timeStamp: string;
    hash: string;
    from: string;
    to: string;
    value: string;
    input: string;
    isError: string;
    methodId: string;
}

export interface EtherscanApiResponse {
    status: string;
    message: string;
    result: EtherscanTransaction[] | string;
}
