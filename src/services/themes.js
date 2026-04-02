export const themes = {
  dark: {
    name: 'Întunecat',
    icon: '🌙',
    vars: {
      '--bg-primary': '#0a0a0f',
      '--bg-secondary': '#12121a',
      '--bg-card': 'rgba(255, 255, 255, 0.04)',
      '--bg-card-hover': 'rgba(255, 255, 255, 0.07)',
      '--bg-glass': 'rgba(255, 255, 255, 0.06)',
      '--bg-input': 'rgba(255, 255, 255, 0.08)',
      '--border-subtle': 'rgba(255, 255, 255, 0.08)',
      '--border-glass': 'rgba(255, 255, 255, 0.12)',
      '--text': '#a1a1aa',
      '--text-dim': '#52525b',
      '--text-bright': '#fafafa',
      '--text-muted': '#71717a',
    }
  },
  midnight: {
    name: 'Midnight Blue',
    icon: '🌊',
    vars: {
      '--bg-primary': '#080c18',
      '--bg-secondary': '#0e1525',
      '--bg-card': 'rgba(100, 150, 255, 0.06)',
      '--bg-card-hover': 'rgba(100, 150, 255, 0.1)',
      '--bg-glass': 'rgba(100, 150, 255, 0.06)',
      '--bg-input': 'rgba(100, 150, 255, 0.08)',
      '--border-subtle': 'rgba(100, 150, 255, 0.1)',
      '--border-glass': 'rgba(100, 150, 255, 0.15)',
      '--text': '#8b9cc7',
      '--text-dim': '#4a5578',
      '--text-bright': '#e8edf8',
      '--text-muted': '#6b7ba5',
    }
  },
  neon: {
    name: 'Neon',
    icon: '💜',
    vars: {
      '--bg-primary': '#0a000f',
      '--bg-secondary': '#12001a',
      '--bg-card': 'rgba(200, 50, 255, 0.06)',
      '--bg-card-hover': 'rgba(200, 50, 255, 0.1)',
      '--bg-glass': 'rgba(200, 50, 255, 0.06)',
      '--bg-input': 'rgba(200, 50, 255, 0.08)',
      '--border-subtle': 'rgba(200, 50, 255, 0.12)',
      '--border-glass': 'rgba(200, 50, 255, 0.18)',
      '--text': '#c4a0d9',
      '--text-dim': '#6b3a80',
      '--text-bright': '#f5e6ff',
      '--text-muted': '#8b5ea0',
    }
  },
  light: {
    name: 'Luminos',
    icon: '☀️',
    vars: {
      '--bg-primary': '#f5f5f7',
      '--bg-secondary': '#eeeef0',
      '--bg-card': 'rgba(0, 0, 0, 0.04)',
      '--bg-card-hover': 'rgba(0, 0, 0, 0.07)',
      '--bg-glass': 'rgba(0, 0, 0, 0.03)',
      '--bg-input': 'rgba(0, 0, 0, 0.05)',
      '--border-subtle': 'rgba(0, 0, 0, 0.08)',
      '--border-glass': 'rgba(0, 0, 0, 0.12)',
      '--text': '#555560',
      '--text-dim': '#999',
      '--text-bright': '#1a1a2e',
      '--text-muted': '#777780',
    }
  },
}

export function applyTheme(themeId) {
  const theme = themes[themeId]
  if (!theme) return
  const root = document.documentElement
  Object.entries(theme.vars).forEach(([key, value]) => {
    root.style.setProperty(key, value)
  })
  localStorage.setItem('theme', themeId)
}

export function getSavedTheme() {
  return localStorage.getItem('theme') || 'dark'
}
