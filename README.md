# zAI-Skills

A Claude Code plugin marketplace with two plugins.

## Installation

### Via [skills.sh](https://skills.sh)

```bash
npx skills add Aznatkoiny/zAI-Skills
```

### Via Claude Code

```bash
# Add the marketplace
/plugin marketplace add Aznatkoiny/zAI-Skills

# Install either or both plugins
/plugin install AI-Toolkit@zAI-Skills
/plugin install consulting-toolkit@zAI-Skills
```

Then restart Claude Code.

---

## Plugins

### [AI-Toolkit](AI-Toolkit/)

Skills for building AI/ML systems and optimizing prompts.

| Skill | Description |
|-------|-------------|
| **deep-learning** | Keras 3 (JAX/TF/PyTorch) — CNNs, RNNs, Transformers, GANs, custom training loops |
| **reinforcement-learning** | Python RL with Stable-Baselines3, RLlib, Gymnasium (PPO, SAC, DQN, TD3, A2C) |
| **cpp-reinforcement-learning** | C++ RL with libtorch and modern C++17/20 for performance-critical applications |
| **prompt-optimizer** | Optimize prompts for Claude 4.x using Anthropic's official best practices |
| **x402-payments** | Build x402 protocol apps — HTTP-native USDC payments on Base (EVM) and Solana (SVM) |

### [consulting-toolkit](consulting-toolkit/)

Multi-agent consulting system replicating top-tier strategy engagement structure.

| Component | Details |
|-----------|---------|
| **Agents** | Engagement Manager, Research Analyst, Financial Modeler, Deck Builder, Due Diligence |
| **Commands** | 15 slash commands across Research, Structured Thinking, Deliverables, and Engagement Management |
| **Skill** | Consulting frameworks — MECE, Pyramid Principle, Porter's Five Forces, TAM/SAM/SOM, and more |
| **MCP Server** | Financial Intelligence — 7 tools for SEC EDGAR, FRED, and Yahoo Finance data |

---

## Projects

| Project | Description |
|---------|-------------|
| [stock_predictor](projects/stock_predictor/) | LSTM-based stock price forecasting with technical indicators |

## Local Development

```bash
# Add local marketplace
/plugin marketplace add /path/to/this/repo

# Install from local
/plugin install AI-Toolkit@zAI-Skills
/plugin install consulting-toolkit@zAI-Skills
```

## License

MIT
