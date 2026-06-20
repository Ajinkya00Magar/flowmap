# FlowMap Sample Files

Use these fixtures from the New Roadmap dialog in Document Outline Parser mode.

- `sample-prompt.txt`: paste this into Text Outline to test prompt-style roadmap creation.
- `roadmap-outline.txt`: upload this to test the current text outline parser.
- `roadmap-outline-text-readable.pdf`: plain-text fixture with a `.pdf` extension for current parser smoke testing.
- `roadmap-outline-text-readable.ppt`: plain-text fixture with a `.ppt` extension for current parser smoke testing.

Current limitation: FlowMap reads uploaded files with `FileReader.readAsText`. Real binary PDF/PPT/PPTX parsing needs a parser service or client parser library before normal PDF and PowerPoint files can become roadmaps reliably.