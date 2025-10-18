# Contributing to GreenThumb Discovery MVP

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on constructive feedback

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone <your-fork-url>`
3. Create a feature branch: `git checkout -b feature/your-feature-name`
4. Set up development environment: `make setup-dev`

## Development Workflow

### 1. Making Changes

```bash
# Create a feature branch
git checkout -b feature/your-feature

# Make your changes
# ... edit files ...

# Format code
make format

# Run quality checks
make quality

# Run tests
make test
```

### 2. Commit Guidelines

Follow conventional commits format:

```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Test additions or changes
- `chore`: Maintenance tasks

Examples:
```
feat(ingestion): add CSV validation
fix(api): correct product endpoint response
docs(readme): update installation instructions
```

### 3. Testing

- Write tests for new features
- Ensure all tests pass: `make test`
- Maintain or improve code coverage
- Test both happy paths and edge cases

### 4. Code Quality

Before submitting:
```bash
# Format code
make format

# Run linting
make lint

# Type checking
make type-check

# Run all quality checks
make quality
```

### 5. Documentation

- Update README.md for user-facing changes
- Add docstrings to new functions/classes
- Update API documentation if needed
- Add comments for complex logic

## Pull Request Process

1. Update documentation
2. Add tests for new features
3. Ensure all tests pass
4. Update CHANGELOG.md (if applicable)
5. Create pull request with clear description

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows project style
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
```

## Project Structure

Follow these conventions:

### Python Code
- Use type hints
- Follow PEP 8 style guide
- Maximum line length: 100 characters
- Use meaningful variable names
- Write docstrings for public functions

### File Organization
- Python packages: lowercase with underscores
- Directories: kebab-case for non-packages
- Test files: prefix with `test_`

### Testing
- Unit tests: `tests/unit/`
- Integration tests: `tests/integration/`
- Use pytest fixtures for setup
- Mock external dependencies

## Review Process

1. Automated checks must pass
2. Code review by maintainer
3. Address feedback
4. Approval and merge

## Questions?

- Open an issue for bugs
- Start a discussion for features
- Ask questions in pull requests

## License

By contributing, you agree that your contributions will be licensed under the project's MIT License.

