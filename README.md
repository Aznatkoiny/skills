# Skills Plugin

A Claude Code plugin providing comprehensive guidance for Deep Learning and Web3 Payments.

## General Installation via Vercel

```bash
npx skills add Aznatkoiny/skills
```

## Installation via Claude Code

```bash
# Add the marketplace
/plugin marketplace add Aznatkoiny/skills

# Install the plugin
/plugin install deep-learning-skills@skills
```

Then restart Claude Code.

## Skills Included

### deep-learning

Comprehensive guide for Deep Learning with Keras 3 (Multi-Backend: JAX, TensorFlow, PyTorch). Use when:
- Building neural networks (Sequential, Functional, Subclassing APIs)
- Working with CNNs for computer vision
- Implementing RNNs/Transformers for NLP
- Time series forecasting
- Generative models (VAEs, GANs)
- Custom training loops and callbacks

**Reference Materials:**
- Keras 3 migration notes
- Computer vision patterns
- NLP & Transformer architectures
- Time series techniques
- Generative deep learning
- Best practices for production

**Utility Scripts:**
- `quick_train.py` - Reusable training template
- `visualize_filters.py` - Convnet filter visualization

### x402-payments

Build applications using the x402 protocol — Coinbase's open standard for HTTP-native stablecoin payments using the HTTP 402 status code. Use when:
- Creating APIs that require USDC payments per request (seller/server side)
- Building clients or AI agents that pay for x402-protected resources (buyer/client side)
- Implementing MCP servers with paid tools for Claude Desktop
- Adding payment middleware to Express, Hono, or Next.js applications
- Working with Base (EVM) or Solana (SVM) payment flows
- Building machine-to-machine or agent-to-agent payment systems

**Reference Materials:**
- Protocol specification (headers, payloads, CAIP-2 IDs)
- Server patterns (Express, Hono, Next.js middleware)
- Client patterns (fetch, axios, wallet setup)
- Agentic patterns (AI agent payments, MCP server integration)
- Deployment guide (testnet to mainnet migration)

## Projects

Example applications built using the deep-learning skill:

| Project | Description |
|---------|-------------|
| [stock_predictor](projects/stock_predictor/) | LSTM-based stock price forecasting with technical indicators |

## Local Development

To test locally:

```bash
# Add local marketplace
/plugin marketplace add /path/to/this/repo

# Install from local
/plugin install deep-learning-skills@deep-learning-skills-dev
```

## License

MIT
