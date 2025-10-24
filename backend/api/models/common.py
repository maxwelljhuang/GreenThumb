"""
Common Models
Shared Pydantic models used across endpoints.
"""

from typing import Optional, Dict, Any
from pydantic import BaseModel, Field


class ErrorResponse(BaseModel):
    """Standard error response model."""

    message: str = Field(..., description="Error message")
    type: str = Field(..., description="Error type")
    details: Optional[Dict[str, Any]] = Field(None, description="Additional error details")


class PaginationParams(BaseModel):
    """Pagination parameters."""

    offset: int = Field(default=0, ge=0, description="Number of results to skip")
    limit: int = Field(default=20, ge=1, le=100, description="Maximum number of results to return")

    @property
    def page(self) -> int:
        """Calculate page number (1-indexed)."""
        if self.limit == 0:
            return 1
        return (self.offset // self.limit) + 1


class FilterParams(BaseModel):
    """Common filter parameters."""

    min_price: Optional[float] = Field(None, ge=0, description="Minimum price filter")
    max_price: Optional[float] = Field(None, ge=0, description="Maximum price filter")
    in_stock: Optional[bool] = Field(None, description="Filter to in-stock products only")
    merchant_ids: Optional[list[int]] = Field(None, description="Filter by merchant IDs")
    category_ids: Optional[list[int]] = Field(None, description="Filter by category IDs")
    brand_ids: Optional[list[int]] = Field(None, description="Filter by brand IDs")
