# ML Dependencies - Quick Installation Guide

## TL;DR (For the Impatient)

```bash
# 1. Activate your virtual environment
source venv/bin/activate  # or create one: python3 -m venv venv

# 2. Install ML dependencies
pip install -r requirements-ml.txt

# 3. Verify installation
python scripts/verify_ml_setup.py

# 4. Done! 🎉
```

---

## What Gets Installed?

| Package | Size | Purpose |
|---------|------|---------|
| **PyTorch** | ~800MB | Deep learning framework |
| **OpenCLIP** | ~300MB | CLIP/SigLIP models for embeddings |
| **FAISS** | ~50MB | Fast vector similarity search |
| **Sentence Transformers** | ~100MB | Text embeddings (optional) |
| **Pillow** | ~10MB | Image processing |
| **Others** | ~100MB | Utilities (tqdm, h5py) |
| **Total** | **~1.4GB** | |

Plus ~500-700MB model weights downloaded on first use.

---

## Installation Time Estimates

| Connection Speed | Download Time | Total Time* |
|-----------------|---------------|-------------|
| Fast (100+ Mbps) | 2-3 min | 5-7 min |
| Medium (20-50 Mbps) | 5-10 min | 10-15 min |
| Slow (<20 Mbps) | 10-20 min | 15-25 min |

*Total includes download + installation + compilation

---

## Common Installation Options

### Option 1: CPU-Only (Default)
```bash
pip install -r requirements-ml.txt
```
✅ Works on all systems
✅ No GPU required
⚠️ Slower embedding generation

### Option 2: GPU-Accelerated (NVIDIA CUDA)
```bash
# Check if CUDA is available
nvidia-smi

# Install GPU version of PyTorch first
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu118

# Then install ML requirements (will use GPU-enabled FAISS if available)
pip install -r requirements-ml.txt

# Or explicitly install GPU FAISS
pip install faiss-gpu
```
✅ 10-50x faster embedding generation
❌ Requires NVIDIA GPU with CUDA

### Option 3: macOS Apple Silicon (M1/M2/M3)
```bash
# PyTorch has Metal Performance Shaders (MPS) support
pip install -r requirements-ml.txt

# Verify MPS support
python -c "import torch; print(f'MPS available: {torch.backends.mps.is_available()}')"
```
✅ Uses Apple GPU acceleration
✅ Faster than CPU on M-series chips

---

## Verification Checklist

After installation, run the verification script:

```bash
python scripts/verify_ml_setup.py
```

Expected output:
```
✓ PyTorch: 2.1.0
✓ OpenCLIP: 2.24.0
✓ FAISS: 1.7.4
✓ Sentence Transformers: 2.3.0
✓ Pillow: 10.0.0
✓ NumPy: 1.26.2
✓ Pandas: 2.1.3
✅ All ML dependencies installed successfully!
```

---

## Troubleshooting Quick Fixes

### ❌ Error: "No matching distribution found for torch"
**Fix:** Update pip first
```bash
pip install --upgrade pip
pip install -r requirements-ml.txt
```

### ❌ Error: "Could not build wheels for faiss-cpu"
**Fix 1:** Use conda (recommended for FAISS issues)
```bash
conda install -c conda-forge faiss-cpu
pip install -r requirements-ml.txt --no-deps
```

**Fix 2:** Install pre-built wheel
```bash
pip install faiss-cpu --no-cache-dir
```

### ❌ Error: "Torch not compiled with CUDA support"
**Fix:** Your PyTorch is CPU-only. Reinstall with CUDA:
```bash
pip uninstall torch torchvision
pip install torch torchvision --index-url https://download.pytorch.org/whl/cu118
```

### ❌ ImportError: "No module named 'open_clip'"
**Fix:** Install directly
```bash
pip install open-clip-torch
```

---

## What's Next?

After successful installation:

1. **Download Models** (optional, saves time on first run)
   ```bash
   python -m backend.ml.download_models
   ```

2. **Proceed to Step 1.2**: Create ML Configuration
   - Create `backend/ml/config.py`
   - See Task 2 documentation

3. **Test Model Loading** (after Step 1.3)
   ```bash
   python -m backend.ml.test_setup
   ```

---

## Need Help?

- **Full guide:** See [ML_SETUP.md](ML_SETUP.md)
- **Task 2 overview:** See PDF page 1-2
- **Report issues:** Check logs in `logs/error/`

---

## Uninstalling

To remove ML dependencies:
```bash
pip uninstall torch torchvision open-clip-torch sentence-transformers faiss-cpu -y
rm -rf models/cache/
```

This frees up ~4-5GB of disk space.
