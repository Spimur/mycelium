// Setzt das Farbschema vor dem ersten Render, damit nichts aufblitzt.
// Eigene Datei statt Inline-Skript, damit die Content-Security-Policy Inline-Skripte verbieten kann.
;(function () {
  var theme
  try {
    theme = localStorage.getItem('mycelium:theme')
    if (theme !== 'light' && theme !== 'dark') theme = matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
  } catch {
    theme = 'dark'
  }
  document.documentElement.dataset.theme = theme
})()
