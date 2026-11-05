import {
  CheckSquare,
  Code2,
  Heading1,
  Heading2,
  Heading3,
  Image,
  List,
  ListOrdered,
  Minus,
  PenTool,
  Quote,
  Table,
  Type,
} from 'lucide-react'
import { t } from '../lib/i18n'

// Labels und Hinweise sind deutsche Schlüssel, übersetzt wird beim Anzeigen
// Blöcke, die über das Slash-Menü (und teilweise die Toolbar) eingefügt werden können
export const BLOCK_COMMANDS = [
  { id: 'text', label: 'Text', hint: 'Normaler Absatz', icon: Type, keywords: 'absatz paragraph text', run: (c) => c.setParagraph() },
  { id: 'h1', label: 'Überschrift 1', hint: 'Grosser Titel', icon: Heading1, keywords: 'heading titel title h1', run: (c) => c.setHeading({ level: 1 }) },
  { id: 'h2', label: 'Überschrift 2', hint: 'Abschnitt', icon: Heading2, keywords: 'heading h2', run: (c) => c.setHeading({ level: 2 }) },
  { id: 'h3', label: 'Überschrift 3', hint: 'Unterabschnitt', icon: Heading3, keywords: 'heading h3', run: (c) => c.setHeading({ level: 3 }) },
  { id: 'todo', label: 'Checkliste', hint: 'Aufgaben zum Abhaken', icon: CheckSquare, keywords: 'todo aufgaben task check', run: (c) => c.toggleTaskList() },
  { id: 'bullet', label: 'Aufzählung', hint: 'Einfache Liste', icon: List, keywords: 'liste list bullet', run: (c) => c.toggleBulletList() },
  { id: 'ordered', label: 'Nummerierte Liste', hint: '1, 2, 3 …', icon: ListOrdered, keywords: 'liste list nummer number ordered', run: (c) => c.toggleOrderedList() },
  { id: 'table', label: 'Tabelle', hint: '3 × 3 mit Kopfzeile', icon: Table, keywords: 'tabelle table raster', run: (c) => c.insertTable({ rows: 3, cols: 3, withHeaderRow: true }) },
  { id: 'image', label: 'Bild', hint: 'Foto hochladen', icon: Image, keywords: 'bild foto image photo picture', run: (c, ctx) => (ctx.pickImage(), c) },
  { id: 'drawing', label: 'Zeichnung', hint: 'Freihand skizzieren', icon: PenTool, keywords: 'zeichnen skizze draw sketch drawing', run: (c) => c.insertContent({ type: 'drawing' }) },
  { id: 'quote', label: 'Zitat', hint: 'Hervorgehobener Text', icon: Quote, keywords: 'zitat quote', run: (c) => c.toggleBlockquote() },
  { id: 'code', label: 'Code', hint: 'Codeblock', icon: Code2, keywords: 'code', run: (c) => c.toggleCodeBlock() },
  { id: 'divider', label: 'Trennlinie', hint: 'Abschnitte trennen', icon: Minus, keywords: 'linie trenner hr divider line', run: (c) => c.setHorizontalRule() },
]

export function filterCommands(query) {
  const q = query.toLowerCase()
  if (!q) return BLOCK_COMMANDS
  return BLOCK_COMMANDS.filter(
    (c) => t(c.label).toLowerCase().includes(q) || c.label.toLowerCase().includes(q) || c.keywords.includes(q),
  )
}
