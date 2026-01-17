/**
 * Ethereum utilities for decoding Zama Community Sale transactions
 */

import { decodeAbiParameters, formatUnits } from 'viem';

// Contract constants
export const ZAMA_CONTRACT_ADDRESS = '0x6716C707573988644b9b9F5a482021b3E09A68b1';
export const PURCHASE_METHOD_ID = '0x70876c98';
export const TOKEN_DECIMALS = 18;

// ABI for the purchase function parameters
const purchaseAbiParams = [
    { name: 'nftId', type: 'uint256' },
    { name: 'saleTokenAmount', type: 'uint256' }
] as const;

/**
 * Check if transaction input data is a purchase transaction
 */
export function isPurchaseTransaction(input: string): boolean {
    return input.toLowerCase().startsWith(PURCHASE_METHOD_ID.toLowerCase());
}

/**
 * Decode purchase transaction input data
 */
export function decodePurchaseInput(input: string): { nftId: bigint; saleTokenAmount: bigint } | null {
    try {
        if (!isPurchaseTransaction(input)) {
            return null;
        }

        // Remove method ID (first 10 characters including 0x)
        const data = `0x${input.slice(10)}` as `0x${string}`;

        const decoded = decodeAbiParameters(purchaseAbiParams, data);

        return {
            nftId: decoded[0],
            saleTokenAmount: decoded[1]
        };
    } catch (error) {
        console.error('Error decoding purchase input:', error);
        return null;
    }
}

/**
 * Format token amount with proper decimals
 */
export function formatTokenAmount(amount: string | bigint, decimals: number = TOKEN_DECIMALS): string {
    try {
        const value = typeof amount === 'string' ? BigInt(amount) : amount;
        return formatUnits(value, decimals);
    } catch {
        return '0';
    }
}

/**
 * Format large numbers with commas for readability
 */
export function formatWithCommas(value: string): string {
    const parts = value.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
}

/**
 * Truncate address for display
 */
export function truncateAddress(address: string, startChars: number = 6, endChars: number = 4): string {
    if (address.length <= startChars + endChars + 2) {
        return address;
    }
    return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

/**
 * Format timestamp to readable date string
 */
export function formatTimestamp(timestamp: number): string {
    return new Date(timestamp * 1000).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
    });
}

/**
 * Get Etherscan transaction URL
 */
export function getEtherscanTxUrl(hash: string): string {
    return `https://etherscan.io/tx/${hash}`;
}

/**
 * Get Etherscan address URL
 */
export function getEtherscanAddressUrl(address: string): string {
    return `https://etherscan.io/address/${address}`;
}
