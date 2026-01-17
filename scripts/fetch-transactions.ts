/**
 * Script to fetch transactions from Etherscan and save to JSON file
 * Run this script once to generate the cached data
 * 
 * Usage: npm run fetch-data
 */

import * as fs from 'fs';
import * as path from 'path';

const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;
const CONTRACT_ADDRESS = '0x6716C707573988644b9b9F5a482021b3E09A68b1';
const ETHERSCAN_API_BASE = 'https://api.etherscan.io/v2/api';

// Purchase function signature (purchase(uint256 nftId, uint256 saleTokenAmount))
const PURCHASE_FUNCTION_SIGNATURE = '0x70876c98';

interface EtherscanTransaction {
    hash: string;
    from: string;
    to: string;
    input: string;
    blockNumber: string;
    timeStamp: string;
    isError: string;
}

interface PurchaseTransaction {
    hash: string;
    from: string;
    to: string;
    nftId: string;
    saleTokenAmount: string;
    saleTokenAmountFormatted: string;
    blockNumber: number;
    timestamp: number;
}

interface TopBuyer {
    address: string;
    totalAmount: string;
    transactionCount: number;
}

interface ScanStatistics {
    totalTransactions: number;
    uniqueBuyers: number;
    totalNftsSold: number;
    totalSaleTokenAmount: string;
    topBuyers: TopBuyer[];
}

interface CachedData {
    transactions: PurchaseTransaction[];
    statistics: ScanStatistics;
    generatedAt: string;
    contractAddress: string;
}

function decodeHex(hex: string): bigint {
    return BigInt(hex);
}

function formatTokenAmount(amount: bigint, decimals: number = 18): string {
    const divisor = BigInt(10 ** decimals);
    const integerPart = amount / divisor;
    const fractionalPart = amount % divisor;

    const fractionalStr = fractionalPart.toString().padStart(decimals, '0');
    const trimmedFractional = fractionalStr.slice(0, 6).replace(/0+$/, '');

    if (trimmedFractional) {
        return `${integerPart}.${trimmedFractional}`;
    }
    return integerPart.toString();
}

function decodePurchaseInput(input: string): { nftId: string; saleTokenAmount: string; saleTokenAmountFormatted: string } | null {
    if (!input.startsWith(PURCHASE_FUNCTION_SIGNATURE)) {
        return null;
    }

    try {
        const data = input.slice(10);

        if (data.length < 128) {
            return null;
        }

        const nftIdHex = '0x' + data.slice(0, 64);
        const saleTokenAmountHex = '0x' + data.slice(64, 128);

        const nftId = decodeHex(nftIdHex).toString();
        const saleTokenAmountBigInt = decodeHex(saleTokenAmountHex);
        const saleTokenAmount = saleTokenAmountBigInt.toString();
        const saleTokenAmountFormatted = formatTokenAmount(saleTokenAmountBigInt);

        return {
            nftId,
            saleTokenAmount,
            saleTokenAmountFormatted,
        };
    } catch {
        return null;
    }
}

async function fetchRawTransactions(): Promise<EtherscanTransaction[]> {
    if (!ETHERSCAN_API_KEY) {
        throw new Error('ETHERSCAN_API_KEY environment variable is required');
    }

    console.log('Fetching transactions from Etherscan...');
    console.log('Contract:', CONTRACT_ADDRESS);
    console.log('API Key:', ETHERSCAN_API_KEY.slice(0, 8) + '...');

    const params = new URLSearchParams({
        chainid: '1',
        module: 'account',
        action: 'txlist',
        address: CONTRACT_ADDRESS,
        startblock: '0',
        endblock: '99999999',
        page: '1',
        offset: '10000',
        sort: 'desc',
        apikey: ETHERSCAN_API_KEY,
    });

    const url = `${ETHERSCAN_API_BASE}?${params}`;
    console.log('Request URL:', url.replace(ETHERSCAN_API_KEY, 'API_KEY'));

    const response = await fetch(url);
    const data = await response.json();

    console.log('Response status:', data.status);
    console.log('Response message:', data.message);
    console.log('Result type:', typeof data.result, Array.isArray(data.result) ? `(array of ${data.result.length})` : '');

    if (data.status !== '1') {
        const errorMsg = typeof data.result === 'string' ? data.result : data.message;
        throw new Error(`Etherscan API error: ${errorMsg}`);
    }

    if (!Array.isArray(data.result)) {
        console.log('Unexpected result:', JSON.stringify(data.result).slice(0, 200));
        throw new Error('Invalid response from Etherscan API');
    }

    return data.result;
}

function processTransactions(rawTransactions: EtherscanTransaction[]): PurchaseTransaction[] {
    const purchaseTransactions: PurchaseTransaction[] = [];

    // Debug: show first 5 transaction signatures
    console.log('Sample transaction inputs (first 5):');
    for (let i = 0; i < Math.min(5, rawTransactions.length); i++) {
        const tx = rawTransactions[i];
        console.log(`  ${i + 1}. ${tx.input.slice(0, 10)} (hash: ${tx.hash.slice(0, 16)}...)`);
    }

    for (const tx of rawTransactions) {
        if (tx.isError === '1') continue;
        if (!tx.input.startsWith(PURCHASE_FUNCTION_SIGNATURE)) continue;

        const decoded = decodePurchaseInput(tx.input);
        if (!decoded) continue;

        purchaseTransactions.push({
            hash: tx.hash,
            from: tx.from,
            to: tx.to,
            nftId: decoded.nftId,
            saleTokenAmount: decoded.saleTokenAmount,
            saleTokenAmountFormatted: decoded.saleTokenAmountFormatted,
            blockNumber: parseInt(tx.blockNumber),
            timestamp: parseInt(tx.timeStamp),
        });
    }

    return purchaseTransactions;
}

function calculateStatistics(transactions: PurchaseTransaction[]): ScanStatistics {
    const uniqueBuyers = new Set<string>();
    const uniqueNfts = new Set<string>();
    let totalAmount = BigInt(0);
    const buyerAmounts = new Map<string, { total: bigint; count: number }>();

    for (const tx of transactions) {
        uniqueBuyers.add(tx.from.toLowerCase());
        uniqueNfts.add(tx.nftId);

        const amount = BigInt(tx.saleTokenAmount);
        totalAmount += amount;

        const buyerKey = tx.from.toLowerCase();
        const existing = buyerAmounts.get(buyerKey) || { total: BigInt(0), count: 0 };
        buyerAmounts.set(buyerKey, {
            total: existing.total + amount,
            count: existing.count + 1,
        });
    }

    // Get top 5 buyers
    const sortedBuyers = Array.from(buyerAmounts.entries())
        .map(([address, data]) => ({
            address,
            totalAmount: formatTokenAmount(data.total),
            transactionCount: data.count,
            rawAmount: data.total,
        }))
        .sort((a, b) => (b.rawAmount > a.rawAmount ? 1 : -1))
        .slice(0, 5)
        .map(({ address, totalAmount, transactionCount }) => ({
            address,
            totalAmount,
            transactionCount,
        }));

    return {
        totalTransactions: transactions.length,
        uniqueBuyers: uniqueBuyers.size,
        totalNftsSold: uniqueNfts.size,
        totalSaleTokenAmount: formatTokenAmount(totalAmount),
        topBuyers: sortedBuyers,
    };
}

async function main() {
    try {
        // Fetch all transactions
        const rawTransactions = await fetchRawTransactions();
        console.log(`Raw transactions fetched: ${rawTransactions.length}`);

        // Process and decode
        const transactions = processTransactions(rawTransactions);
        console.log(`Purchase transactions processed: ${transactions.length}`);

        // Calculate statistics
        const statistics = calculateStatistics(transactions);
        console.log('Statistics calculated');

        // Prepare cached data
        const cachedData: CachedData = {
            transactions,
            statistics,
            generatedAt: new Date().toISOString(),
            contractAddress: CONTRACT_ADDRESS,
        };

        // Ensure directory exists
        const dataDir = path.join(process.cwd(), 'public', 'data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        // Save to JSON file
        const filePath = path.join(dataDir, 'transactions.json');
        fs.writeFileSync(filePath, JSON.stringify(cachedData, null, 2));

        console.log(`\n✅ Data saved to ${filePath}`);
        console.log(`   - Total Transactions: ${statistics.totalTransactions}`);
        console.log(`   - Unique Buyers: ${statistics.uniqueBuyers}`);
        console.log(`   - Total NFTs Sold: ${statistics.totalNftsSold}`);
        console.log(`   - Total ZAMA: ${statistics.totalSaleTokenAmount}`);

    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

main();
