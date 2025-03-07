# DemCodes - YouTube Promotional Code Monitor

DemCodes is a sophisticated web application that automatically monitors YouTube channels, extracts promotional codes from video transcripts using AI, and maintains a database of active promotional offers.

## 🚀 Features

- **Real-time YouTube Monitoring**
  - Automatic channel subscription management
  - WebSub (PubSubHubbub) integration for instant video notifications
  - Automatic subscription renewal handling

- **Smart Code Extraction**
  - AI-powered transcript analysis using GPT-4
  - Automatic extraction of:
    - Service names
    - Promotional codes
    - Discount details
    - Offer URLs
  - Duplicate code detection and update tracking

- **Channel Management**
  - Bulk channel import
  - Real-time subscription status monitoring
  - Channel statistics tracking
    - Video count
    - Event count
    - Code count

- **Background Processing**
  - Reliable job scheduling with Graphile Worker
  - Automatic retry mechanisms
  - Failed job handling

## 🛠️ Tech Stack

- **Frontend**
  - Next.js 15
  - React 18
  - TypeScript
  - CSS Modules

- **Backend**
  - tRPC for type-safe APIs
  - Drizzle ORM for database management
  - Graphile Worker for job processing
  - OpenAI GPT-4 for code extraction

- **Database**
  - PostgreSQL

## 📋 Prerequisites

- Node.js 18+
- PostgreSQL 13+
- OpenAI API key
- YouTube Data API access

## 🙏 Acknowledgments

- [T3 Stack](https://create.t3.gg/) for the application foundation
- [Drizzle ORM](https://orm.drizzle.team) for database management
- [tRPC](https://trpc.io) for type-safe APIs
- [OpenAI](https://openai.com) for AI-powered code extraction
