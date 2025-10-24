# ML Setup Guide - GreenThumb

This guide covers setting up the machine learning dependencies for Task 2: Embedding Generation & User Modeling.

## Prerequisites

- Python 3.8 or higher (you have Python 3.13.7 ✓)
- PostgreSQL with pgvector extension
- 8GB+ RAM recommended
- Optional: CUDA-compatible GPU for faster embedding generation

## Quick Start

### 1. Create Virtual Environment (if not already done)

```bash
python3 -m venv venv
source venv/bin/activate  # On macOS/Linux
# OR
# venv\Scripts\activate  # On Windows
```

### 2. Install Core Dependencies First

```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### 3. Install ML Dependencies

```bash
pip install -r requirements-ml.txt
```

**Note:** This will download ~2-3GB of dependencies including PyTorch and related libraries. The installation may take 5-10 minutes depending on your internet connection.

### 4. Verify Installation

```bash
python -c "import torch; print(f'PyTorch version: {torch.__version__}')"
python -c "import open_clip; print('OpenCLIP installed successfully')"
python -c "import faiss; print('FAISS installed successfully')"
```

## GPU Support (Optional)

If you have an NVIDIA GPU with CUDA support:

1. Check CUDA availability:
```bash
nvidia-smi
```

2. Install GPU-enabled FAISS:
```bash
pip uninstall faiss-cpu
pip install faiss-gpu>=1.7.4
```

3. Verify GPU support:
```bash
python -c "import torch; print(f'CUDA available: {torch.cuda.is_available()}')"
```

## Troubleshooting

### Issue: PyTorch installation fails

**Solution:** Install PyTorch separately first:
```bash
# CPU-only (macOS, Linux without GPU)
pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu

# Then install other dependencies
pip install -r requirements-ml.txt
```

### Issue: FAISS installation fails on macOS

**Solution:** Use conda instead:
```bash
conda install -c conda-forge faiss-cpu
```

### Issue: Out of memory during model loading

**Solution:**
- Close other applications
- Use smaller batch sizes in `backend/ml/config.py`
- Consider using CPU instead of GPU for initial setup

### Issue: OpenCLIP model download is slow

**Solution:**
- Model weights (~500MB) are downloaded on first use
- Pre-download models using: `python -m backend.ml.download_models`
- Models are cached in `models/cache/` directory

## Disk Space Requirements

- Python packages: ~3GB
- Model weights (downloaded on first use):
  - CLIP ViT-B/32: ~500MB
  - SigLIP: ~700MB
- FAISS indexes (generated later): ~500MB per 100k products
- **Total:** ~5GB minimum

## Next Steps

After installation:
1. Run the test script: `python -m backend.ml.test_setup`
2. Proceed to Step 1.2: Create ML Configuration File
3. See the main PDF document for full Task 2 roadmap

## Uninstalling

To remove ML dependencies and free up space:
```bash
pip uninstall torch torchvision open-clip-torch sentence-transformers faiss-cpu -y
rm -rf models/cache/
```
