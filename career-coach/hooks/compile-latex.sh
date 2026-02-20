#!/usr/bin/env bash
set -euo pipefail

# compile-latex.sh — PostToolUse hook for career-coach plugin
# Reads tool input JSON from stdin, compiles .tex or converts .md resumes to PDF.

# Read stdin into a variable
INPUT="$(cat)"

# Extract file_path from tool_input using python3
FILE_PATH="$(echo "$INPUT" | python3 -c "
import sys, json
data = json.load(sys.stdin)
tool_input = data.get('tool_input', data.get('input', {}))
print(tool_input.get('file_path', ''))
" 2>/dev/null || true)"

# Guard: must have a file path
if [[ -z "$FILE_PATH" ]]; then
  exit 0
fi

# Guard: must be under a /resumes/ path
if [[ "$FILE_PATH" != */resumes/* ]]; then
  exit 0
fi

# Guard: must be .md or .tex
EXT="${FILE_PATH##*.}"
if [[ "$EXT" != "md" && "$EXT" != "tex" ]]; then
  exit 0
fi

# Derive output PDF path (same dir, same basename)
DIR="$(dirname "$FILE_PATH")"
BASENAME="$(basename "$FILE_PATH" ".$EXT")"
PDF_PATH="$DIR/$BASENAME.pdf"

if [[ "$EXT" == "tex" ]]; then
  # --- Compile .tex with xelatex ---
  if command -v xelatex &>/dev/null; then
    LATEX_BIN="xelatex"
  elif command -v pdflatex &>/dev/null; then
    LATEX_BIN="pdflatex"
  else
    echo "[career-coach hook] xelatex/pdflatex not found. Install TeX Live or MiKTeX to auto-compile resumes." >&2
    exit 0
  fi

  echo "[career-coach hook] Compiling $FILE_PATH with $LATEX_BIN ..." >&2
  "$LATEX_BIN" -interaction=nonstopmode -output-directory="$DIR" "$FILE_PATH" >&2

  # Clean up auxiliary files
  for EXT_CLEAN in aux log out; do
    CLEAN_FILE="$DIR/$BASENAME.$EXT_CLEAN"
    if [[ -f "$CLEAN_FILE" ]]; then
      rm -f "$CLEAN_FILE"
    fi
  done

  echo "[career-coach hook] PDF written to $PDF_PATH" >&2

elif [[ "$EXT" == "md" ]]; then
  # --- Convert .md to PDF with pandoc ---
  if ! command -v pandoc &>/dev/null; then
    echo "[career-coach hook] pandoc not found. Install pandoc to auto-convert Markdown resumes to PDF." >&2
    exit 0
  fi

  if command -v xelatex &>/dev/null; then
    PDF_ENGINE="xelatex"
  elif command -v pdflatex &>/dev/null; then
    PDF_ENGINE="pdflatex"
  else
    echo "[career-coach hook] xelatex/pdflatex not found. Install TeX Live or MiKTeX to compile Markdown resumes." >&2
    exit 0
  fi

  echo "[career-coach hook] Converting $FILE_PATH to PDF with pandoc + $PDF_ENGINE ..." >&2
  pandoc "$FILE_PATH" \
    --pdf-engine="$PDF_ENGINE" \
    -V geometry:margin=0.75in \
    -V fontsize=11pt \
    -o "$PDF_PATH" >&2

  echo "[career-coach hook] PDF written to $PDF_PATH" >&2
fi
