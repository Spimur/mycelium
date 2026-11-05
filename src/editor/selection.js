import { TextSelection } from '@tiptap/pm/state'

/**
 * Ist gerade ein ganzer Block (Bild, Zeichnung) ausgewählt, würde Einfügen ihn ersetzen.
 * Dieser Befehl setzt den Cursor stattdessen hinter den Block: chain().command(leaveBlockSelection)
 */
export function leaveBlockSelection({ tr }) {
  if (tr.selection.node) tr.setSelection(TextSelection.near(tr.doc.resolve(tr.selection.to)))
  return true
}
