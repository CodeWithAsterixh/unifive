# Contributing to UNIFIVE

Thank you for your interest in contributing to **UNIFIVE**! We welcome community contributions including bug reports, documentation improvements, new asset packs, and engine features.

---

## Code of Conduct

Please treat everyone with respect and kindness. We are committed to providing a welcoming, inclusive, and harassment-free environment for all contributors.

---

## How to Contribute

### 1. Reporting Bugs
- Search existing issues to ensure the bug hasn't already been reported.
- Open a new issue with clear reproduction steps, browser version, and OS.
- Include console error logs and screenshots when applicable.

### 2. Suggesting Features
- Open an issue describing the proposed feature, user value, and technical ideas.
- For new visual block scripting blocks or engine primitives, provide example use cases.

### 3. Submitting Code Changes
1. **Fork the repository** on GitHub.
2. **Create a topic branch**:
   ```bash
   git checkout -b feature/awesome-new-block
   ```
3. **Keep it Vanilla**:
   - UNIFIVE intentionally uses zero-dependency vanilla JavaScript and HTML5 Canvas.
   - Avoid adding heavy external npm build dependencies.
4. **Follow the Design System**:
   - Adhere to the retro dark burgundy pixel aesthetic (`#120308`, `#eab308`, `#10b981`).
   - Do not use blurred glow filters; use crisp 1-2px pixel borders and stepped box-shadows.
5. **Test in Modern Browsers**:
   - Verify on Chrome, Firefox, Safari, and mobile/touch viewports.
6. **Submit a Pull Request** with a descriptive summary of your changes.

---

## Adding New Pixel Art Assets & Sprites

When contributing new sprite sheets or tile sets:
1. Place assets inside `assets/` under appropriate subdirectories.
2. Update `assets.json` with item definitions:
   - `id`: Unique identifier
   - `name`: Human-readable title
   - `category`: Target category ID
   - `perspective`: `"sidefacing"` or `"topdown"`
   - `type`: `"sprite"`, `"tile"`, `"prop"`, or `"structure"`
   - `poses`: Frame coordinates and sequence counts (for animated sprites)
3. Ensure sprite sheets maintain proper pixel aspect ratios and crisp transparency without anti-aliasing artifacts.

---

## License

By contributing to UNIFIVE, you agree that your contributions will be licensed under the project's [MIT License](LICENSE).
