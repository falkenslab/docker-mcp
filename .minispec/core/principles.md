# Principles

1. **Domain tools, not plumbing.** Each tool is a task the person would name; never a raw HTTP call or a shell (ADR-003).
2. **Say what changes.** A tool that only reads says so (`readOnlyHint`); one that writes says what and asks to be confirmed.
3. **One file, nothing to install.** The bundle runs with `npx`; nothing native, no Python (ADR-001).
4. **Explain, never install.** A program the person needs is checked and explained, never installed (ADR-004).
5. **Results a model can use.** Structured output, short and paged; errors that say what to do next.
6. **English everywhere** in the repository; Spanish in the docs site's locale (ADR-002).
