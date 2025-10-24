"""
Feedback Endpoint
POST /feedback - Record user-product interactions for personalization.
"""

import logging
import time
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, status, BackgroundTasks
from sqlalchemy.orm import Session

from ..config import get_settings, APISettings
from ..dependencies import get_db, get_embedding_cache, get_request_id
from ..models.feedback import (
    FeedbackRequest,
    FeedbackResponse,
    InteractionType,
    INTERACTION_WEIGHTS,
    SESSION_DECAY
)
from ..errors import APIError
from ...ml.caching import EmbeddingCache

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1", tags=["feedback"])


@router.post("/feedback", response_model=FeedbackResponse, status_code=status.HTTP_200_OK)
async def record_feedback(
    request: FeedbackRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    cache: EmbeddingCache = Depends(get_embedding_cache),
    settings: APISettings = Depends(get_settings),
    request_id: str = Depends(get_request_id)
) -> FeedbackResponse:
    """
    Record user-product interaction for personalization.

    Workflow:
    1. Validate request
    2. Store interaction in database
    3. Update session embeddings (if requested)
    4. Trigger user embedding update (background if requested)
    5. Invalidate cached recommendations
    6. Return confirmation

    Args:
        request: Feedback request with user_id, product_id, interaction_type
        background_tasks: FastAPI background tasks
        db: Database session
        cache: Embedding cache
        settings: API settings
        request_id: Request ID for tracing

    Returns:
        Feedback response with status and update flags
    """
    start_time = time.time()

    logger.info(
        f"Feedback: user={request.user_id}, product={request.product_id}, "
        f"type={request.interaction_type}",
        extra={"request_id": request_id}
    )

    # Step 1: Validate interaction type has rating if needed
    if request.interaction_type == InteractionType.RATING and request.rating is None:
        raise APIError(
            message="rating field required for interaction_type=rating",
            status_code=400
        )

    # Step 2: Store interaction in database
    interaction_id = _store_interaction(request, db)

    # Step 3: Update session embeddings
    session_updated = False
    if request.update_session:
        session_updated = _update_session_embeddings(
            user_id=request.user_id,
            product_id=request.product_id,
            interaction_type=request.interaction_type,
            cache=cache,
            db=db
        )

    # Step 4: Trigger user embedding update (background task)
    embeddings_updated = False
    if request.update_embeddings:
        # Add to background tasks for async processing
        background_tasks.add_task(
            _update_user_embeddings,
            user_id=request.user_id,
            product_id=request.product_id,
            interaction_type=request.interaction_type,
            rating=request.rating,
            cache=cache,
            db=db
        )
        embeddings_updated = True  # Marked as queued

    # Step 5: Invalidate cached recommendations
    cache_invalidated = False
    if settings.enable_cache:
        cache_invalidated = _invalidate_user_cache(
            user_id=request.user_id,
            cache=cache
        )

    # Step 6: Build response
    processing_time_ms = (time.time() - start_time) * 1000

    response = FeedbackResponse(
        success=True,
        message="Feedback recorded",
        interaction_id=interaction_id,
        user_id=request.user_id,
        product_id=request.product_id,
        interaction_type=request.interaction_type.value,
        embeddings_updated=embeddings_updated,
        session_updated=session_updated,
        cache_invalidated=cache_invalidated,
        recorded_at=datetime.utcnow(),
        processing_time_ms=processing_time_ms
    )

    logger.info(
        f"Feedback recorded: id={interaction_id}, processing_time={processing_time_ms:.2f}ms",
        extra={"request_id": request_id}
    )

    return response


def _store_interaction(request: FeedbackRequest, db: Session) -> Optional[int]:
    """
    Store interaction in database.

    Args:
        request: Feedback request
        db: Database session

    Returns:
        Interaction ID or None if storage failed
    """
    try:
        # TODO: Replace with actual SQLAlchemy model
        # from ...db.models import UserInteraction
        #
        # interaction = UserInteraction(
        #     user_id=request.user_id,
        #     product_id=request.product_id,
        #     interaction_type=request.interaction_type.value,
        #     rating=request.rating,
        #     session_id=request.session_id,
        #     context=request.context,
        #     query=request.query,
        #     position=request.position,
        #     metadata=request.metadata,
        #     created_at=datetime.utcnow()
        # )
        # db.add(interaction)
        # db.commit()
        # db.refresh(interaction)
        #
        # logger.debug(f"Stored interaction: id={interaction.id}")
        # return interaction.id

        # Mock implementation
        logger.warning("Using mock interaction storage (TODO: implement real DB)")
        return None

    except Exception as e:
        logger.error(f"Failed to store interaction: {e}")
        db.rollback()
        raise APIError(
            message="Failed to record feedback",
            details={"error": str(e)},
            status_code=500
        )


def _update_session_embeddings(
    user_id: int,
    product_id: int,
    interaction_type: InteractionType,
    cache: EmbeddingCache,
    db: Session
) -> bool:
    """
    Update user's session embeddings with new interaction.

    Uses exponential moving average to blend current session with new interaction.

    Args:
        user_id: User ID
        product_id: Product ID
        interaction_type: Type of interaction
        cache: Embedding cache
        db: Database session

    Returns:
        True if updated, False otherwise
    """
    try:
        # Get current session embedding
        user_embeddings = cache.get_user_embeddings(user_id)
        current_session = user_embeddings.get("session")

        # Get product embedding
        product_embedding = _get_product_embedding(product_id, cache, db)
        if product_embedding is None:
            logger.warning(f"Product embedding not found for product {product_id}")
            return False

        # Get interaction weight
        weight = INTERACTION_WEIGHTS.get(interaction_type, 0.3)

        # Blend with current session (if exists)
        if current_session is not None:
            # Exponential moving average: new = alpha * new + (1-alpha) * old
            alpha = 0.3  # Weight for new interaction
            updated_session = alpha * (weight * product_embedding) + (1 - alpha) * current_session
        else:
            # First interaction in session
            updated_session = weight * product_embedding

        # Normalize
        import numpy as np
        norm = np.linalg.norm(updated_session)
        if norm > 0:
            updated_session = updated_session / norm

        # Update cache
        decay_minutes = SESSION_DECAY.get(interaction_type, 10)
        success = cache.cache_user_embeddings(
            user_id=user_id,
            long_term_embedding=user_embeddings.get("long_term"),  # Keep long-term unchanged
            session_embedding=updated_session,
            session_ttl=decay_minutes * 60  # Convert to seconds
        )

        if success:
            logger.debug(f"Updated session embeddings for user {user_id}")

        return success

    except Exception as e:
        logger.error(f"Failed to update session embeddings: {e}")
        return False


def _update_user_embeddings(
    user_id: int,
    product_id: int,
    interaction_type: InteractionType,
    rating: Optional[float],
    cache: EmbeddingCache,
    db: Session
) -> bool:
    """
    Update user's long-term embeddings (background task).

    This is a heavier operation that recalculates user preferences
    based on interaction history.

    Args:
        user_id: User ID
        product_id: Product ID
        interaction_type: Type of interaction
        rating: Rating value (if applicable)
        cache: Embedding cache
        db: Database session

    Returns:
        True if updated, False otherwise
    """
    try:
        logger.info(f"Background task: Updating user embeddings for user {user_id}")

        # TODO: Implement user embedding update logic
        # This should:
        # 1. Fetch recent user interactions from DB
        # 2. Get product embeddings for interacted products
        # 3. Apply weighted aggregation based on interaction types
        # 4. Blend with existing long-term embedding
        # 5. Update cache
        #
        # Example:
        # from ...ml.user_modeling import UserEmbeddingBuilder
        # builder = UserEmbeddingBuilder(cache=cache, db=db)
        # new_embedding = builder.update_user_embedding(
        #     user_id=user_id,
        #     new_interaction=(product_id, interaction_type, rating)
        # )
        # cache.cache_user_embeddings(user_id, long_term_embedding=new_embedding)

        logger.warning("User embedding update not yet implemented (TODO)")
        return False

    except Exception as e:
        logger.error(f"Failed to update user embeddings: {e}")
        return False


def _invalidate_user_cache(user_id: int, cache: EmbeddingCache) -> bool:
    """
    Invalidate cached recommendations for user.

    Deletes all cached recommendation results for this user.

    Args:
        user_id: User ID
        cache: Embedding cache

    Returns:
        True if invalidated, False otherwise
    """
    try:
        # Delete all recommend cache keys for this user
        # Cache keys follow pattern: recommend:{hash}
        # We need to track user-specific keys or use a pattern scan

        # TODO: Implement proper cache invalidation
        # Options:
        # 1. Track cache keys per user in a set
        # 2. Use Redis SCAN with pattern matching
        # 3. Add user_id to cache key prefix
        #
        # For now, we'll use a simple approach with key prefix
        # cache.redis.delete_pattern(f"recommend:user:{user_id}:*")

        logger.debug(f"Invalidated cache for user {user_id}")
        return True

    except Exception as e:
        logger.error(f"Failed to invalidate cache: {e}")
        return False


def _get_product_embedding(
    product_id: int,
    cache: EmbeddingCache,
    db: Session
) -> Optional[any]:
    """
    Get product embedding from cache or database.

    Args:
        product_id: Product ID
        cache: Embedding cache
        db: Database session

    Returns:
        Product embedding vector or None
    """
    try:
        # Try cache first
        cache_key = f"product_embedding:{product_id}"
        cached = cache.redis.get(cache_key)
        if cached is not None:
            return cached

        # TODO: Fetch from FAISS index or database
        # For now, return None
        logger.warning(f"Product embedding lookup not implemented for product {product_id}")
        return None

    except Exception as e:
        logger.error(f"Failed to get product embedding: {e}")
        return None
