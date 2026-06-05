# Website Design Guidelines (Vercel Aesthetic)

## Core Principles
1. **Dark Mode Default:** The website should primarily feature a dark theme (bg-black or very dark slate).
2. **Minimalism:** Use whitespace generously. Remove unnecessary borders or cluttered containers.
3. **Typography:** Use Inter or a clean Sans-Serif font. Keep headings bold but clean.
4. **Contrast & Borders:** Use subtle, 1px borders (e.g., `border-gray-800` or `border-zinc-800`) to define sections instead of heavy drop shadows.

## Color Palette
- **Background:** `bg-black` or `bg-[#0a0a0a]`
- **Text:** `text-white` for primary headings, `text-gray-400` for paragraphs.
- **Accents:** Use very subtle gradients for buttons or hero text (e.g., `bg-gradient-to-r from-gray-200 to-gray-500 bg-clip-text text-transparent`).

## Components
- **Buttons:** Sharp corners or slightly rounded (`rounded-md`). High contrast (`bg-white text-black` for primary, `bg-transparent border border-gray-700 text-white` for secondary).
- **Cards/Glassmorphism:** Use `bg-white/5 backdrop-blur-lg border border-white/10` to create floating translucent cards.
- **Micro-animations:** Add subtle hover effects (`hover:border-gray-500 transition-colors duration-300`).

## Sections
- **Hero:** Big, bold centered text with a gradient effect, a subheadline, and two buttons.
- **Services/Features:** Grid layout with clean icons and minimalist cards.
- **Testimonials:** Simple text block with the reviewer's name and minimal avatar.
- **Footer:** Very simple, separated by a top border, with small gray text.
