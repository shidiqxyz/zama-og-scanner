# Zama Community Sale NFT Scanner

A modern web application to scan and analyze NFT purchase transactions from the Zama OG Community Sale on Ethereum.

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss)

## Features

✅ **Transaction Scanner** - Fetch and decode all purchase transactions from the Zama Community Sale contract  
✅ **Statistics Dashboard** - View total transactions, unique buyers, NFTs sold, and top buyers  
✅ **Advanced Filtering** - Filter by NFT ID, search by buyer address, sort by various fields  
✅ **Pagination** - Handle large transaction lists with efficient pagination  
✅ **CSV Export** - Export transaction data to CSV for further analysis  
✅ **Copy to Clipboard** - Quickly copy addresses and transaction hashes  
✅ **Dark Mode** - Beautiful dark-themed UI with Zama-inspired colors  
✅ **Responsive Design** - Works on desktop, tablet, and mobile devices

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **Blockchain**: viem for transaction decoding
- **Data Fetching**: TanStack React Query
- **Data Source**: Etherscan API

## Getting Started

### Prerequisites

- Node.js 18+ installed
- An Etherscan API key (get one free at [etherscan.io/apis](https://etherscan.io/apis))

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd zama-og
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   # Copy the example env file
   cp .env.example .env.local
   
   # Edit .env.local and add your Etherscan API key
   ETHERSCAN_API_KEY=your_api_key_here
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

1. The default contract address is pre-filled: `0x6716C707573988644b9b9F5a482021b3E09A68b1`
2. Click **"Scan Transactions"** to fetch all purchase transactions
3. View statistics in the **Statistics** tab
4. Browse transactions in the **Transactions** tab
5. Use filters to search by address or filter by NFT ID
6. Export data using the **Export CSV** button

## Contract Details

- **Contract Address**: `0x6716C707573988644b9b9F5a482021b3E09A68b1`
- **Network**: Ethereum Mainnet
- **Function**: `purchase(uint256 nftId, uint256 saleTokenAmount)`
- **Method ID**: `0x70876c98`

## Project Structure

```
src/
├── app/
│   ├── api/scan/route.ts    # API endpoint for scanning
│   ├── globals.css          # Global styles
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Main page
├── components/
│   ├── scanner/
│   │   ├── scanner-dashboard.tsx
│   │   ├── transaction-table.tsx
│   │   ├── stats-panel.tsx
│   │   └── search-filter.tsx
│   ├── ui/                  # shadcn/ui components
│   └── providers.tsx        # React Query & Theme providers
├── lib/
│   ├── ethereum.ts          # Blockchain utilities
│   ├── etherscan.ts         # Etherscan API integration
│   └── utils.ts             # General utilities
└── types/
    └── transaction.ts       # TypeScript definitions
```

## Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ETHERSCAN_API_KEY` | Yes | Your Etherscan API key |
| `NEXT_PUBLIC_CONTRACT_ADDRESS` | No | Default contract address |

## Rate Limits

The Etherscan free tier has a rate limit of 5 calls/second. The scanner implements:
- Automatic pagination with delays
- Client-side caching (5 minutes)
- Error handling for rate limits

## License

MIT

## Acknowledgments

- Built for the Zama community
- Data sourced from [Etherscan](https://etherscan.io)
- UI components from [shadcn/ui](https://ui.shadcn.com)
