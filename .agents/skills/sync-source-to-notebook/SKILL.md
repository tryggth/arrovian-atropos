---
name: sync-source-to-notebook
description: >-
  Bundles all Arrovian Atropos PWA source code into combined_source_code.txt
  with per-file delimiter headers and syncs it to the "Hidden Dictator Game"
  NotebookLM notebook (2b675003-edce-43bf-91cd-5d0ee2c33f77). Use this skill
  after every git push to GitHub or whenever the user asks to bundle or sync
  the codebase to NotebookLM.
---

# Sync Source Code Bundle to NotebookLM

This skill bundles the entire Arrovian Atropos PWA codebase into a single delimited text file (`combined_source_code.txt`) and updates it in the **Hidden Dictator Game** NotebookLM notebook (`2b675003-edce-43bf-91cd-5d0ee2c33f77`) so the Gemini app can inspect the live implementation.

## Procedure

1. **Generate the Source Bundle (`combined_source_code.txt`)**:
   Run the root concatenation script:
   ```bash
   npm run bundle
   ```
   Verify that `/home/tryggth2009/arrovian-atropos/combined_source_code.txt` is updated and contains `/* === FILE: <path> === */` headers for all project files.

2. **Check Existing Sources in NotebookLM**:
   Call `notebook_get` on `gemini-notebook-mcp` with:
   - `notebook_id`: `"2b675003-edce-43bf-91cd-5d0ee2c33f77"`
   Look for any existing source titled `"combined_source_code.txt"`.

3. **Upload the Fresh `combined_source_code.txt` Bundle**:
   Call `source_add` on `gemini-notebook-mcp` with:
   - `notebook_id`: `"2b675003-edce-43bf-91cd-5d0ee2c33f77"`
   - `source_type`: `"file"`
   - `file_path`: `"/home/tryggth2009/arrovian-atropos/combined_source_code.txt"`
   - `wait`: `true`

4. **Remove Superseded Bundle (If Present)**:
   If an older `"combined_source_code.txt"` source UUID was found in Step 2, delete the old source UUID via `source_delete(source_id="<old-uuid>", confirm=True)` after the new upload succeeds so only the current source bundle remains in the notebook.
