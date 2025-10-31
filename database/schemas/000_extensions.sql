-- Install required PostgreSQL extensions
-- This script runs before other schema files (alphabetically first)

-- UUID generation functions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Fuzzy text matching for search
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Vector similarity search (for embeddings in future tasks)
CREATE EXTENSION IF NOT EXISTS vector;
