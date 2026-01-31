# Deep Learning Skills Plugin

A Claude Code plugin providing comprehensive Deep Learning guidance with Keras 3 (Multi-Backend: JAX, TensorFlow, PyTorch).

## Installation

```bash
# Add the marketplace
/plugin marketplace add Aznatkoiny/skills

# Install the plugin
/plugin install deep-learning-skills@skills
```

Then restart Claude Code.

## Skills Included

### deep-learning

Comprehensive guide for Deep Learning with Keras 3. Use when:
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
