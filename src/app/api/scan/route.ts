import { NextRequest, NextResponse } from 'next/server';

interface CachedData {
    transactions: unknown[];
    statistics: unknown;
    generatedAt: string;
    contractAddress: string;
}

export async function GET(request: NextRequest) {
    try {
        // Build the URL for the cached JSON file
        const protocol = request.headers.get('x-forwarded-proto') || 'http';
        const host = request.headers.get('host') || 'localhost:3000';
        const cacheUrl = `${protocol}://${host}/data/transactions.json`;

        try {
            const response = await fetch(cacheUrl, {
                next: { revalidate: 60 } // Cache for 60 seconds
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch cache: ${response.status}`);
            }

            const cachedData: CachedData = await response.json();

            console.log(`[Cache Hit] Serving ${cachedData.transactions.length} transactions from cache (generated: ${cachedData.generatedAt})`);

            return NextResponse.json({
                success: true,
                transactions: cachedData.transactions,
                totalCount: cachedData.transactions.length,
                statistics: cachedData.statistics,
                cached: true,
                cachedAt: cachedData.generatedAt,
            });
        } catch (cacheError) {
            // Cache file doesn't exist, fall back to API
            console.log('[Cache Miss] No cached data found, fetching from Etherscan API...');
        }

        // Fall back to Etherscan API if no cache
        const searchParams = request.nextUrl.searchParams;
        const contractAddress = searchParams.get('contractAddress');

        if (!contractAddress) {
            return NextResponse.json(
                { success: false, error: 'Contract address is required' },
                { status: 400 }
            );
        }

        const apiKey = process.env.ETHERSCAN_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { success: false, error: 'Etherscan API key not configured. Please run "npm run fetch-data" to generate cached data.' },
                { status: 500 }
            );
        }

        // Import and use the original etherscan module
        const { fetchPurchaseTransactions, calculateStatistics } = await import('@/lib/etherscan');

        const transactions = await fetchPurchaseTransactions(contractAddress, apiKey);
        const statistics = calculateStatistics(transactions);

        return NextResponse.json({
            success: true,
            transactions,
            totalCount: transactions.length,
            statistics,
            cached: false,
        });

    } catch (error) {
        console.error('[API Error]', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to fetch transactions'
            },
            { status: 500 }
        );
    }
}
