"""DEPRECATED: This package has been moved to ``agent/``.

After pulling this commit, please run:

    git rm -r src/
    git commit -m "chore: remove deprecated src/ package"

All imports should now use ``agent.*`` instead of ``src.*``.
"""
import warnings

warnings.warn(
    "The 'src' package has been moved to 'agent'. "
    "Update your imports: 'from src.X' -> 'from agent.X'.",
    DeprecationWarning,
    stacklevel=2,
)
