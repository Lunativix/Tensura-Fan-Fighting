export interface DomField {
  name: string
  label: string
  type: 'text' | 'email' | 'password' | 'checkbox'
  placeholder?: string
}

export interface DomFormOptions {
  title: string
  hint?: string
  fields: DomField[]
  submitLabel: string
  cancelLabel?: string
  onSubmit: (values: Record<string, string | boolean>) => void | Promise<void>
  onCancel: () => void
}

export function openDomForm(host: HTMLElement, options: DomFormOptions): () => void {
  const veil = document.createElement('div')
  veil.className = 'account-form-veil'
  const card = document.createElement('form')
  card.className = 'account-form-card'
  card.setAttribute('autocomplete', 'on')

  const title = document.createElement('h2')
  title.textContent = options.title
  card.appendChild(title)

  if (options.hint) {
    const hint = document.createElement('p')
    hint.className = 'account-form-hint'
    hint.textContent = options.hint
    card.appendChild(hint)
  }

  const error = document.createElement('p')
  error.className = 'account-form-error'
  card.appendChild(error)

  const inputs = new Map<string, HTMLInputElement>()
  for (const field of options.fields) {
    const row = document.createElement('label')
    row.className = field.type === 'checkbox' ? 'account-form-check' : 'account-form-row'
    const caption = document.createElement('span')
    caption.textContent = field.label
    const input = document.createElement('input')
    input.name = field.name
    input.type = field.type
    if (field.placeholder) {
      input.placeholder = field.placeholder
    }
    if (field.type === 'checkbox') {
      row.appendChild(input)
      row.appendChild(caption)
    } else {
      row.appendChild(caption)
      row.appendChild(input)
    }
    inputs.set(field.name, input)
    card.appendChild(row)
  }

  const actions = document.createElement('div')
  actions.className = 'account-form-actions'
  const submit = document.createElement('button')
  submit.type = 'submit'
  submit.textContent = options.submitLabel
  const cancel = document.createElement('button')
  cancel.type = 'button'
  cancel.textContent = options.cancelLabel ?? 'Annuler'
  actions.appendChild(submit)
  actions.appendChild(cancel)
  card.appendChild(actions)

  const readValues = (): Record<string, string | boolean> => {
    const values: Record<string, string | boolean> = {}
    for (const [name, input] of inputs) {
      values[name] = input.type === 'checkbox' ? input.checked : input.value
    }
    return values
  }

  const close = (): void => {
    veil.remove()
  }

  card.addEventListener('submit', (event) => {
    event.preventDefault()
    error.textContent = ''
    void Promise.resolve(options.onSubmit(readValues())).catch((reason: unknown) => {
      error.textContent = reason instanceof Error ? reason.message : String(reason)
    })
  })
  cancel.addEventListener('click', () => {
    close()
    options.onCancel()
  })

  veil.appendChild(card)
  host.appendChild(veil)
  inputs.values().next().value?.focus()
  return close
}

export function downloadJson(filename: string, payload: unknown): void {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
