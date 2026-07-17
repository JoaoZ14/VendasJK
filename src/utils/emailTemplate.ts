import templateHtml from '../../emails/primeiro-contato.html?raw'

export function buildFirstContactSubject(clientName: string): string {
  return `Contato comercial - ${clientName}`
}

export function buildFirstContactHtml(clientName: string): string {
  return templateHtml.replaceAll('{cliente}', clientName || 'seu estabelecimento')
}

function htmlToPlainText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export async function copyHtmlEmail(html: string): Promise<void> {
  const plain = htmlToPlainText(html)

  if (typeof ClipboardItem !== 'undefined' && navigator.clipboard?.write) {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([html], { type: 'text/html' }),
          'text/plain': new Blob([plain], { type: 'text/plain' }),
        }),
      ])
      return
    } catch {
      // fallback abaixo
    }
  }

  await navigator.clipboard.writeText(plain)
}

export function openGmailCompose(to: string, subject: string): void {
  const url = new URL('https://mail.google.com/mail/')
  url.searchParams.set('view', 'cm')
  url.searchParams.set('fs', '1')
  url.searchParams.set('to', to)
  url.searchParams.set('su', subject)
  window.open(url.toString(), '_blank', 'noopener,noreferrer')
}

/** Copia o HTML formatado e abre o Gmail com destinatário + assunto. */
export async function prepareFirstContactEmail(
  to: string,
  clientName: string,
): Promise<{ subject: string }> {
  const subject = buildFirstContactSubject(clientName)
  const html = buildFirstContactHtml(clientName)
  await copyHtmlEmail(html)
  openGmailCompose(to, subject)
  return { subject }
}
