if [ $# -gt 0 ]; then
    s1="^tdd/.*"
    s2=".*\\.test\\.js"
    pattern=$s1$1$s2
else
    pattern="^tdd/.+\\.test\\.js"
fi
echo "Running tests matching pattern: $pattern"
# exit 0
npx jest --testPathPatterns "$pattern"