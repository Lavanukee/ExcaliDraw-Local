# Excalidraw LLM Enhanced & Excalidash

This is an enhanced fork of Excalidraw (https://github.com/excalidraw/excalidraw) made for local use that integrates local LLM capabilities via llamacpp, a built-in dashboard for drawing management, and programmatic conversion tools.

---

## Key Features

### 1. Integrated Dashboard (Excalidash)
This version includes a built-in local dashboard for managing your sketches:
- **Local Database**: All drawings are saved locally via IndexedDB.
- **Drawing Management**: View, delete, and organize your sketch history directly in the app.
- **Instant Access**: Quick-start from the dashboard with one click.

### 2. LLM Text-to-Diagram
A dedicated LLM assistant for canvas workflows:
- **Local LLM Integration**: Connects to any local LLM server (compatible with llama-server / OpenAI API format).
- **Thinking Process Visualization**: View the LLM's step-by-step reasoning with collapsible thinking blocks in the chat UI.
- **Dynamic Prompting**: Sidebar for editing the global system prompt to tune model outputs.
- **Smart Parsing**: Automatically isolates and validates Mermaid code from model outputs.

### 3. Programmatic Mermaid Converter*
A custom converter that handles geometry and styles with high accuracy:
- **Box Grouping**: Automatically detects when you draw a box around elements and converts them into Mermaid subgraphs.
- **Color Mapping**: Preserves background, stroke, and text colors.
- **Shape Detection**: Maps rectangles, diamonds, and ellipses to the correct Mermaid syntax.
- **Label Mapping**: Robust handling of floating text and bound labels.

*This implementation is far from perfect and still has obvious flaws with complex charts.


### 4. UI and Grid Options
- **Clean Interface**: Top bar removed to maximize whiteboard space.
- **Vertical Toolbar**: Right-side tools for LLM generation and Mermaid exports.
- **Extended Grids**:  Spport for grid types, standard Dot grids and Isometric Dot grids for sketching.

---

## Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/Lavanukee/ExcaliDraw-Local.git
cd ExcaliDraw-Local
npm install
```

### 2. Start the App
```bash
npm start
```

### 3. LLM Setup (Optional)
To use the Text to Diagram feature, run a local model server. We recommend using **qwen3.5-4b** as it provides a great balance of speed and logic for most hardware setups.

Example with llama-server:
```bash
llama-server -m qwen3.5-4b.gguf --host 0.0.0.0 --port 8080
```
The app defaults to `http://127.0.0.1:8080/v1/chat/completions`.

---

## Tech Stack
- **Frontend**: React, TypeScript, Excalidraw Core
- **Styling**: Vanilla CSS, Lucide Icons
- **Storage**: IndexedDB (Local-first)
- **Generation**: Custom TTD implementation with streaming support

---

## Reference
This project is a fork of Excalidraw. All core canvas logic belongs to the original maintainers. Features in this fork are designed for local-first, LLM-assisted workflows.
