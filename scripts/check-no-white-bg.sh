#!/bin/bash
RESULT=$(grep -rn --include="*.tsx" --include="*.ts" \
  -E "bg-white\b|bg-(neutral|gray|slate|zinc|stone)-(50|100|200)\b" \
  apps/web/app apps/web/components apps/web/lib 2>/dev/null \
  | grep -v "node_modules" \
  | grep -v "\.next" \
  | grep -v "bg-white/" \
  | grep -v "rounded-full bg-white shadow" \
  || true)

if [ -n "$RESULT" ]; then
  echo "Hardcoded white/light backgrounds found:"
  echo "$RESULT"
  exit 1
fi

echo "No hardcoded light backgrounds."
