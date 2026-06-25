import { useState, useEffect, useRef } from 'react'
import { Button } from '../ui/Button'
import { Icon } from '../ui/Icon'
import { Spinner } from '../ui/Misc'
import { listDocuments, uploadDocument, getDocumentUrl, deleteDocument, type DbDocument } from '../../lib/db'

interface Props {
  shipmentRef: string
  toast: (t: { type: string; title: string; msg?: string }) => void
}

const ALLOWED = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'application/xml', 'text/xml', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
const MAX_SIZE = 10 * 1024 * 1024 // 10 MB

function fmtSize(bytes: number) {
  if (bytes <= 0) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function extOf(name: string) {
  const stripped = name.replace(/^\d+-/, '') // quita el timestamp del prefijo
  const m = stripped.match(/\.([a-zA-Z0-9]+)$/)
  return (m ? m[1] : 'file').toUpperCase()
}

function displayName(name: string) {
  return name.replace(/^\d+-/, '')
}

export function DocumentsManager({ shipmentRef, toast }: Props) {
  const [docs, setDocs] = useState<DbDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [busyPath, setBusyPath] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const load = () => {
    setLoading(true)
    listDocuments(shipmentRef)
      .then(setDocs)
      .catch(() => toast({ type: 'error', title: 'No se pudieron cargar los documentos' }))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [shipmentRef])

  const doUpload = async (file: File) => {
    if (file.size > MAX_SIZE) { toast({ type: 'warning', title: 'Archivo muy grande', msg: 'Máximo 10 MB' }); return }
    if (file.type && !ALLOWED.includes(file.type)) { toast({ type: 'warning', title: 'Tipo no permitido', msg: 'PDF, XML, Word o imágenes' }); return }
    setUploading(true)
    try {
      await uploadDocument(shipmentRef, file)
      toast({ type: 'success', title: 'Documento subido', msg: file.name })
      load()
    } catch (e) {
      toast({ type: 'error', title: 'Error al subir', msg: (e as Error).message })
    } finally {
      setUploading(false)
    }
  }

  const onFiles = (files: FileList | null) => {
    if (!files) return
    Array.from(files).forEach(doUpload)
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setDragActive(false)
    onFiles(e.dataTransfer.files)
  }

  const download = async (d: DbDocument) => {
    setBusyPath(d.path)
    try {
      const url = await getDocumentUrl(d.path)
      window.open(url, '_blank')
    } catch {
      toast({ type: 'error', title: 'No se pudo abrir el documento' })
    } finally {
      setBusyPath(null)
    }
  }

  const remove = async (d: DbDocument) => {
    setBusyPath(d.path)
    try {
      await deleteDocument(d.path)
      toast({ type: 'success', title: 'Documento eliminado' })
      setDocs(ds => ds.filter(x => x.path !== d.path))
    } catch {
      toast({ type: 'error', title: 'No se pudo eliminar' })
    } finally {
      setBusyPath(null)
    }
  }

  return (
    <div>
      {/* Dropzone */}
      <div
        onDragEnter={e => { e.preventDefault(); setDragActive(true) }}
        onDragOver={e => { e.preventDefault(); setDragActive(true) }}
        onDragLeave={e => { e.preventDefault(); setDragActive(false) }}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        style={{
          border: `2px dashed ${dragActive ? 'var(--primary)' : 'var(--border)'}`,
          borderRadius: 12, padding: '24px 16px', textAlign: 'center',
          background: dragActive ? 'var(--blue-50)' : 'var(--gray-50)',
          cursor: 'pointer', transition: 'all 0.15s', marginBottom: 14,
        }}
      >
        <input
          ref={inputRef} type="file" multiple hidden
          accept=".pdf,.xml,.jpg,.jpeg,.png,.webp,.doc,.docx"
          onChange={e => { onFiles(e.target.files); e.target.value = '' }}
        />
        <div style={{ width: 44, height: 44, borderRadius: 11, background: 'var(--blue-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
          {uploading ? <Spinner size={20} /> : <Icon name="upload" size={21} style={{ color: 'var(--primary)' }} />}
        </div>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-strong)', marginBottom: 3 }}>
          {uploading ? 'Subiendo…' : 'Arrastra archivos aquí o haz clic'}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>PDF, XML, Word o imágenes · Máx 10 MB</div>
      </div>

      {/* Lista */}
      {loading ? (
        <div style={{ padding: 24, textAlign: 'center' }}><Spinner size={24} /></div>
      ) : docs.length === 0 ? (
        <div style={{ padding: '20px 0', textAlign: 'center', fontSize: 13, color: 'var(--text-faint)' }}>
          Aún no hay documentos para este envío.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {docs.map((d, i) => {
            const ext = extOf(d.name)
            const isXml = ext === 'XML'
            return (
              <div key={d.path} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0', borderBottom: i < docs.length - 1 ? '1px solid var(--border-soft)' : 'none' }}>
                <span style={{
                  width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                  background: isXml ? 'var(--green-50)' : 'var(--red-50)',
                  color: isXml ? 'var(--green-600)' : 'var(--red-500)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 800, letterSpacing: 0.5,
                }}>{ext.slice(0, 4)}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-strong)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{displayName(d.name)}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 2 }}>
                    {fmtSize(d.size)} · {new Date(d.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>
                <Button size="sm" variant="ghost" icon="download" loading={busyPath === d.path} onClick={() => download(d)}>Abrir</Button>
                <Button size="sm" variant="ghost" icon="close" onClick={() => remove(d)} />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
