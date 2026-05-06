'use client'

import { useState } from 'react'

type Item = {
  title: string
  description: string
  section: string
  images: string[]
}

const DESCRIPTION_SUFFIX =
  'En las fotografías puedes encontrar las medidas.\n\n' +
  '*\n\n' +
  'El coste de envío indicado en el artículo es a Península. Otros destinos consultar.\n' +
  'Enviamos por correos certificado con seguro de envío incluido.\n' +
  'Puede recoger el artículo en nuestra tienda de Barcelona sin coste.\n' +
  'Agrupamos pedidos así optimizar el coste del envío según peso y volumen.\n\n' +
  '*\n\n' +
  'Revisa nuestro catálogo, siempre hay artículos interesantes.'

export default function Home() {
  const [items, setItems] = useState<Item[]>([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [section, setSection] = useState('')
  const [images, setImages] = useState<string[]>(Array(10).fill(''))
  const [bulkImages, setBulkImages] = useState('')
  const [loadingAI, setLoadingAI] = useState(false)

  const clean = (value: string, max?: number) => {
    const cleaned = value
      .replace(/#/g, ' ')
      .replace(/\r?\n|\r/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    return max ? cleaned.slice(0, max) : cleaned
  }

  const finalDescription = (text: string) =>
    clean(text + '\n\n' + DESCRIPTION_SUFFIX, 1000)

  const handleBulkImages = (text: string) => {
    setBulkImages(text)

    const urls = text
      .split(/[\n,]+/)
      .map((u) => u.trim())
      .filter(Boolean)
      .slice(0, 10)

    const filled = Array(10).fill('')
    urls.forEach((url, i) => {
      filled[i] = url
    })

    setImages(filled)
  }

  const updateImage = (index: number, value: string) => {
    const updated = [...images]
    updated[index] = value
    setImages(updated)
  }

  const generateAI = async () => {
    if (!images[0]) {
      alert('Primero pega al menos una imagen')
      return
    }

    setLoadingAI(true)

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: images.filter(Boolean),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        alert(data.error || 'Error IA')
        return
      }

      setTitle(data.title || '')
      setDescription(data.description || '')
      setSection(data.section || '')
    } catch {
      alert('Error conexión IA')
    } finally {
      setLoadingAI(false)
    }
  }

  const addItem = () => {
    if (!title || !description || !section || !images[0]) {
      alert('Faltan título, descripción, sección o imagen principal')
      return
    }

    if (title.length > 100) {
      alert('El título supera los 100 caracteres')
      return
    }

    if (finalDescription(description).length > 1000) {
      alert('La descripción final supera los 1.000 caracteres')
      return
    }

    if (!/^\d+$/.test(section)) {
      alert('La sección debe ser solo numérica')
      return
    }

    setItems([...items, { title, description, section, images }])

    setTitle('')
    setDescription('')
    setSection('')
    setImages(Array(10).fill(''))
    setBulkImages('')
  }

  const exportCSV = () => {
    if (items.length === 0) {
      alert('No hay lotes para exportar')
      return
    }

    const header = [
      'REFERENCIA',
      'TÍTULO',
      'DESCRIPCIÓN',
      'PRECIO VENTA DIRECTA',
      'PRECIO SALIDA SUBASTA',
      'SECCIÓN',
      'ESTADO',
      'DESCRIPCIÓN DEL ESTADO',
      'IMAGEN 1 (principal)',
      'IMAGEN 2',
      'IMAGEN 3',
      'IMAGEN 4',
      'IMAGEN 5',
      'IMAGEN 6',
      'IMAGEN 7',
      'IMAGEN 8',
      'IMAGEN 9',
      'IMAGEN 10',
      'FORMA DE ENVÍO',
      'GASTOS FIJOS',
    ]

    const rows = items.map((item, index) => [
      String(index + 1),
      clean(item.title, 100),
      finalDescription(item.description),
      '100',
      '0,01',
      clean(item.section, 100),
      '3',
      'Ver imágenes',
      ...item.images.map((img) => clean(img, 100)),
      'Otros',
      '6,50',
    ])

    const csv = [header, ...rows].map((row) => row.join('#')).join('\n')
    const blob = new Blob(['\ufeff' + csv], {
      type: 'text/csv;charset=utf-8;',
    })

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'subastas_extraordinarias_importamatic.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <main style={{ minHeight: '100vh', background: '#f3f3f3', padding: 24 }}>
      <div
        style={{
          maxWidth: 1000,
          margin: '0 auto',
          background: 'white',
          padding: 24,
          borderRadius: 16,
        }}
      >
        <h1>Importamatic Subastas Extraordinarias</h1>

        <p>
          Referencia correlativa · Venta directa 100 € · Salida subasta 0,01 € ·
          Estado 3 · Envío Otros · Gastos fijos 6,50 €
        </p>

       <input
  type="file"
  multiple
  accept="image/*"
  onChange={async (e) => {
    const files = Array.from(e.target.files || [])

    const uploadedUrls: string[] = []

    for (const file of files) {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      uploadedUrls.push(data.url)
    }

    setImageUrls(uploadedUrls.join('\n'))
  }}
  className="w-full border rounded p-3"
/>

        <button
          onClick={generateAI}
          disabled={loadingAI}
          style={{
            padding: 14,
            background: loadingAI ? '#999' : '#1a73e8',
            color: 'white',
            border: 0,
            borderRadius: 8,
            marginBottom: 12,
            width: '100%',
            fontWeight: 'bold',
          }}
        >
          {loadingAI ? 'Generando con IA...' : 'Generar con IA'}
        </button>

        <input
          style={{ width: '100%', padding: 12, marginBottom: 12 }}
          placeholder="Título máximo 100 caracteres"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <textarea
          style={{ width: '100%', padding: 12, marginBottom: 12, minHeight: 120 }}
          placeholder="Descripción máximo 1.000 caracteres incluyendo texto fijo"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <input
          style={{ width: '100%', padding: 12, marginBottom: 12 }}
          placeholder="Sección numérica"
          value={section}
          onChange={(e) => setSection(e.target.value)}
        />

        {images.map((image, index) => (
          <input
            key={index}
            style={{ width: '100%', padding: 10, marginBottom: 8 }}
            placeholder={
              index === 0
                ? 'Imagen 1 principal URL'
                : `Imagen ${index + 1} URL`
            }
            value={image}
            onChange={(e) => updateImage(index, e.target.value)}
          />
        ))}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <button
            onClick={addItem}
            style={{
              padding: 14,
              background: 'black',
              color: 'white',
              border: 0,
              borderRadius: 8,
            }}
          >
            Añadir lote
          </button>

          <button
            onClick={exportCSV}
            style={{
              padding: 14,
              background: 'green',
              color: 'white',
              border: 0,
              borderRadius: 8,
            }}
          >
            Exportar CSV Importamatic
          </button>
        </div>

        <h2 style={{ marginTop: 24 }}>Lotes añadidos: {items.length}</h2>

        {items.map((item, index) => (
          <div
            key={index}
            style={{
              border: '1px solid #ddd',
              padding: 10,
              marginBottom: 8,
              borderRadius: 8,
            }}
          >
            <strong>{index + 1}</strong> · {item.title} · Sección {item.section} ·{' '}
            {item.images.filter(Boolean).length} fotos
          </div>
        ))}
      </div>
    </main>
  )
}