"""Setup script for GreenThumb Discovery MVP."""

from setuptools import setup, find_packages

setup(
    name="greenthumb-discovery",
    version="0.1.0",
    packages=find_packages(exclude=["tests*", "docs*"]),
    include_package_data=True,
    install_requires=[
        "fastapi>=0.104.0",
        "uvicorn[standard]>=0.24.0",
        "sqlalchemy>=2.0.0",
        "alembic>=1.13.0",
        "pydantic>=2.5.0",
        "pandas>=2.1.0",
    ],
    extras_require={
        "dev": [
            "pytest>=7.4.0",
            "pytest-cov>=4.1.0",
            "black>=23.11.0",
            "isort>=5.13.0",
            "flake8>=6.1.0",
            "mypy>=1.7.0",
        ],
    },
    python_requires=">=3.11",
)

