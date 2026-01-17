/**
 * Etherscan API integration for fetching transaction data
 */

import type { EtherscanTransaction, EtherscanApiResponse, PurchaseTransaction } from '@/types/transaction';
import {
    isPurchaseTransaction,
    decodePurchaseInput,
    formatTokenAmount,
    ZAMA_CONTRACT_ADDRESS
} from './ethereum';

// Etherscan API V2 endpoint
const ETHERSCAN_API_BASE = 'https://api.etherscan.io/v2/api';
const ETHEREUM_CHAINID = '1'; // Ethereum Mainnet

interface FetchTransactionsOptions {
    contractAddress?: string;
    apiKey: string;
    startBlock?: number;
    endBlock?: number;
    page?: number;
    offset?: number;
}

/**
 * Fetch all transactions to a contract address from Etherscan
 */
export async function fetchContractTransactions(
    options: FetchTransactionsOptions
): Promise<EtherscanTransaction[]> {
    const {
        contractAddress = ZAMA_CONTRACT_ADDRESS,
        apiKey,
        startBlock = 0,
        endBlock = 99999999,
        page = 1,
        offset = 10000, // Max allowed by Etherscan
    } = options;

    const params = new URLSearchParams({
        chainid: ETHEREUM_CHAINID,
        module: 'account',
        action: 'txlist',
        address: contractAddress,
        startblock: startBlock.toString(),
        endblock: endBlock.toString(),
        page: page.toString(),
        offset: offset.toString(),
        sort: 'desc',
        apikey: apiKey,
    });

    const response = await fetch(`${ETHERSCAN_API_BASE}?${params}`);

    if (!response.ok) {
        throw new Error(`Etherscan API error: ${response.statusText}`);
    }

    const data: EtherscanApiResponse = await response.json();

    console.log('Etherscan API Response:', JSON.stringify(data, null, 2));

    if (data.status !== '1') {
        // Status 0 with "No transactions found" is valid
        if (data.message === 'No transactions found') {
            return [];
        }
        // Include the result field which often contains the actual error
        const errorDetail = typeof data.result === 'string' ? data.result : data.message;
        throw new Error(`Etherscan API error: ${errorDetail}`);
    }

    if (!Array.isArray(data.result)) {
        throw new Error('Invalid response from Etherscan API');
    }

    return data.result;
}

/**
 * Fetch and decode all purchase transactions
 */
export async function fetchPurchaseTransactions(
    apiKey: string,
    contractAddress?: string
): Promise<PurchaseTransaction[]> {
    const transactions: PurchaseTransaction[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
        const batch = await fetchContractTransactions({
            apiKey,
            contractAddress,
            page,
            offset: 10000,
        });

        // Process each transaction
        for (const tx of batch) {
            // Skip failed transactions
            if (tx.isError === '1') continue;

            // Check if it's a purchase transaction
            if (!isPurchaseTransaction(tx.input)) continue;

            // Decode the input data
            const decoded = decodePurchaseInput(tx.input);
            if (!decoded) continue;

            transactions.push({
                hash: tx.hash,
                blockNumber: parseInt(tx.blockNumber),
                timestamp: parseInt(tx.timeStamp),
                from: tx.from,
                to: tx.to,
                nftId: decoded.nftId.toString(),
                saleTokenAmount: decoded.saleTokenAmount.toString(),
                saleTokenAmountFormatted: formatTokenAmount(decoded.saleTokenAmount),
            });
        }

        // Check if there are more pages
        if (batch.length < 10000) {
            hasMore = false;
        } else {
            page++;
            // Add a small delay to respect rate limits
            await new Promise(resolve => setTimeout(resolve, 250));
        }
    }

    return transactions;
}

/**
 * Calculate statistics from purchase transactions
 */
export function calculateStatistics(transactions: PurchaseTransaction[]) {
    const buyerMap = new Map<string, {
        totalAmount: bigint;
        transactionCount: number;
        ensName?: string;
    }>();

    let totalAmount = BigInt(0);
    const uniqueNfts = new Set<string>();

    for (const tx of transactions) {
        uniqueNfts.add(tx.nftId);

        const amount = BigInt(tx.saleTokenAmount);
        totalAmount += amount;

        const existing = buyerMap.get(tx.from.toLowerCase());
        if (existing) {
            existing.totalAmount += amount;
            existing.transactionCount++;
        } else {
            buyerMap.set(tx.from.toLowerCase(), {
                totalAmount: amount,
                transactionCount: 1,
                ensName: tx.ensName,
            });
        }
    }

    // Get top 5 buyers
    const topBuyers = Array.from(buyerMap.entries())
        .sort((a, b) => (b[1].totalAmount > a[1].totalAmount ? 1 : -1))
        .slice(0, 5)
        .map(([address, data]) => ({
            address,
            ensName: data.ensName,
            totalAmount: formatTokenAmount(data.totalAmount),
            transactionCount: data.transactionCount,
        }));

    return {
        totalTransactions: transactions.length,
        uniqueBuyers: buyerMap.size,
        totalNftsSold: uniqueNfts.size,
        totalSaleTokenAmount: formatTokenAmount(totalAmount),
        topBuyers,
    };
}
