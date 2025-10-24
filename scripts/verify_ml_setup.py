#!/usr/bin/env python3
"""
Verify ML Dependencies Installation
Run this after: pip install -r requirements-ml.txt
"""

import sys
from typing import List, Tuple

def check_import(module_name: str, package_name: str = None) -> Tuple[bool, str]:
    """Try to import a module and return success status with version info"""
    if package_name is None:
        package_name = module_name

    try:
        module = __import__(module_name)
        version = getattr(module, '__version__', 'unknown')
        return True, f"✓ {package_name}: {version}"
    except ImportError as e:
        return False, f"✗ {package_name}: NOT FOUND ({str(e)})"

def main():
    print("=" * 60)
    print("  GreenThumb ML Dependencies Verification")
    print("=" * 60)
    print()

    checks: List[Tuple[str, str]] = [
        # Core ML frameworks
        ("torch", "PyTorch"),
        ("torchvision", "TorchVision"),

        # Embedding models
        ("open_clip", "OpenCLIP"),
        ("sentence_transformers", "Sentence Transformers"),

        # Vector search
        ("faiss", "FAISS"),

        # Image processing
        ("PIL", "Pillow"),

        # Utilities
        ("tqdm", "tqdm"),
        ("h5py", "h5py"),

        # Already installed (from requirements.txt)
        ("numpy", "NumPy"),
        ("pandas", "Pandas"),
        ("sklearn", "scikit-learn"),
    ]

    results = []
    failed = []

    print("Checking installed packages...\n")

    for module_name, package_name in checks:
        success, message = check_import(module_name, package_name)
        results.append(message)
        if not success:
            failed.append(package_name)
        print(message)

    print("\n" + "=" * 60)

    if not failed:
        print("✅ All ML dependencies installed successfully!")
        print("\nAdditional checks:")

        # Check PyTorch CUDA availability
        try:
            import torch
            cuda_available = torch.cuda.is_available()
            if cuda_available:
                print(f"✓ CUDA available: {torch.cuda.get_device_name(0)}")
            else:
                print("ℹ CUDA not available (CPU-only mode)")
        except:
            pass

        # Check FAISS variant
        try:
            import faiss
            if hasattr(faiss, 'StandardGpuResources'):
                print("✓ FAISS GPU variant installed")
            else:
                print("ℹ FAISS CPU variant installed")
        except:
            pass

        print("\n" + "=" * 60)
        print("Next steps:")
        print("1. Run: python -m backend.ml.download_models")
        print("2. Proceed to Step 1.2: Create ML Configuration")
        print("=" * 60)
        return 0
    else:
        print(f"❌ {len(failed)} package(s) missing: {', '.join(failed)}")
        print("\nTo install missing packages:")
        print("  pip install -r requirements-ml.txt")
        print("\nFor troubleshooting, see: ML_SETUP.md")
        print("=" * 60)
        return 1

if __name__ == "__main__":
    sys.exit(main())
