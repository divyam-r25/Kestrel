# Roadmap (maps to the planning spreadsheet)

1. **Voice loop** (T03-T07): wake word, whisper.cpp, Piper, latency benchmark on 3 laptops.
2. **Live model integration**: exercise `OllamaProvider` against a real Ollama; measure tool-call reliability per model size.
3. **Windows hardening**: run port lookup / paths on real Windows; job-object sandbox for `shell.run`.
4. **Tauri shell**: approval prompts, audit viewer, settings, tray.
5. **Website**: questionnaire -> config, accounts, downloads.
6. **Installer**: review-changes screen, rollback, code signing, signed auto-update.
7. **Memory v2**: local embeddings (sqlite-vec) behind the same `recall` API.
8. **Skill SDK + marketplace**: third-party skills declare tier/sideEffects/network up front.
