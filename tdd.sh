if [ $# -gt 0 ]; then
    s1="^tdd/.*"
    s2=".*\\.test\\.js"
    pattern=$s1$1$s2
else
    pattern="^tdd/.+\\.test\\.js"
fi
npx jest --testPathPatterns "$pattern" --detectOpenHandles