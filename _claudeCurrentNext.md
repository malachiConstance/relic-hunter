# Current problem
None blocking. Five changes just shipped in this session.

# Current state
All changes built cleanly. Map always stays mounted (fog canvas survives screen switches). Pray button moved to top-right below quest indicator, hint changed to "+1". False leads now 60% peaceful / 40% robbery. Exam feedback stays until player clicks OK; no more layout shift. All sub-1rem font sizes bumped by ~1pt.

# Last 2 interactions
1. e5a260d (previous): hid relic history/fun fact during exam, removed castle graphic.
2. This session: fog-flash fix, pray button rename+move, false-lead risk/reward, exam OK button + layout fix, global font size bump.

# Next steps
1. Commit and push all changes when user asks.
2. User will supply a real castle image later; re-wire intro screen when they do.
3. Clean up stray file `src/components/RestPanel 2.tsx`.
