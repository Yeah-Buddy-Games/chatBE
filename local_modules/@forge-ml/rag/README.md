# Forge RAG (Retrieval-Augmented Generation) Package

## Overview

This package provides a flexible and efficient implementation of Retrieval-Augmented Generation (RAG) for Node.js applications. It offers tools for document chunking, embedding generation, vector storage, and similarity search, enabling developers to build powerful RAG systems.

## Features

- Document chunking with various strategies
- Embedding generation using OpenAI or Nomic AI
- Vector storage and retrieval using Redis
- Flexible querying and similarity search
- Utility functions for text preprocessing and token estimation

## Installation

```bash
npm install @forge-ml/rag
```

## Quick Start

```typescript
import { createRagger, OpenAIEmbedder, RedisVectorStore } from "@forge-ml/rag";

const embedder = new OpenAIEmbedder({ apiKey: "your-openai-api-key" });
const vectorStore = new RedisVectorStore("redis://localhost:6379");

const ragger = createRagger(embedder, vectorStore);

// Initialize a document
const chunks = await ragger.initializeDocument("Your document text here");

// Query the document
const results = await ragger.query("Your query here");
```

## Core Components

### Embedder

The package supports two embedding providers:

1. OpenAI Embedder

```typescript
const embedder = new OpenAIEmbedder({
  type: "openai",
  apiKey: process.env.OPENAI_API_KEY,
});
```

2. Nomic Embedder

```typescript
const embedder = new NomicEmbedder({
  type: "nomic",
  apiKey: process.env.NOMIC_API_KEY,
});
```

### Vector Store

The package uses Redis as the vector store:

```typescript
const vectorStore = new RedisVectorStore(process.env.REDIS_URL);
```

## API Reference

### `createRagger(embedder: Embedder, vectorStore: VectorStore)`

Creates a new RAG instance with the specified embedder and vector store.

### `ragger.initializeDocument(text: string, options?: InitializeDocumentOptions)`

Chunks the input text and stores the embeddings in the vector store.

### `ragger.query(query: string)`

Performs a similarity search based on the input query and returns relevant chunks.

## Configuration

### Redis Setup

To set up the Redis vector store, use the provided Docker Compose file:

```1:22:docker/redis.yml
version: '3.8'

services:
  redis:
    image: redis/redis-stack:latest
    container_name: redis
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: >
      redis-server
      --appendonly yes
      --protected-mode no
      --loadmodule /opt/redis-stack/lib/redisearch.so
      --loadmodule /opt/redis-stack/lib/rejson.so
    restart: always

volumes:
  redis_data:
    driver: local

```

Run the following script to start the Redis container:

```1:26:scripts/vector-store.sh
#!/bin/bash

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        echo "Docker is not running. Please start Docker and try again."
        exit 1
    fi
}

# Function to spin up the vector store
spin_up_vector_store() {
    echo "Spinning up the vector store..."
    docker compose -f docker/redis.yml up -d
    if [ $? -eq 0 ]; then
        echo "Vector store is now running."
    else
        echo "Failed to start the vector store. Please check the Docker logs for more information."
        exit 1
    fi
}

# Main execution
check_docker
spin_up_vector_store

```

## Contributing

Contributions are welcome! Please refer to the [CONTRIBUTING.md](CONTRIBUTING.md) file for guidelines.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- OpenAI for their embedding API
- Nomic AI for their embedding capabilities
- Redis for providing an efficient vector store solution

```

```
