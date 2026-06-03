'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { renderAsync } from 'docx-preview';
import localforage from 'localforage';
import { AlertCircle, DownloadCloud, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { StoredMaterial } from '@/components/material/MaterialAttachment';
import type { AppState } from '@/lib/types';

type PreviewKind = 'pdf' | 'image' | 'video' | 'audio' | 'text' | 'docx' | 'pptx' | 'unsupported';

const getFileExtension = (fileName?: string) => fileName?.split('.').pop()?.toLowerCase() || '';

const getMimeType = (fileData?: string) => fileData?.match(/^data:([^;]+);/)?.[1] || 'application/octet-stream';

const getPreviewKind = (fileName?: string, fileData?: string): PreviewKind => {
  const extension = getFileExtension(fileName);
  const mimeType = getMimeType(fileData);

  if (mimeType === 'application/pdf' || extension === 'pdf') return 'pdf';
  if (mimeType.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'].includes(extension)) return 'image';
  if (mimeType.startsWith('video/') || ['mp4', 'webm', 'ogg'].includes(extension)) return 'video';
  if (mimeType.startsWith('audio/') || ['mp3', 'wav', 'oga'].includes(extension)) return 'audio';
  if (mimeType.startsWith('text/') || ['txt', 'csv'].includes(extension)) return 'text';
  if (extension === 'docx') return 'docx';
  if (extension === 'pptx') return 'pptx';

  return 'unsupported';
};

const dataUrlToBlob = async (dataUrl: string) => {
  const response = await fetch(dataUrl);
  return response.blob();
};

const dataUrlToArrayBuffer = async (dataUrl: string) => {
  const blob = await dataUrlToBlob(dataUrl);
  return blob.arrayBuffer();
};

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const getImageMimeType = (fileName: string) => {
  const extension = getFileExtension(fileName);

  if (extension === 'png') return 'image/png';
  if (extension === 'jpg' || extension === 'jpeg') return 'image/jpeg';
  if (extension === 'gif') return 'image/gif';
  if (extension === 'webp') return 'image/webp';
  if (extension === 'svg') return 'image/svg+xml';

  return 'application/octet-stream';
};

const readTagAttributes = (tag: string) => {
  const attributes = new Map<string, string>();
  const pattern = /([\w:-]+)="([^"]*)"/g;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(tag)) !== null) {
    attributes.set(match[1], match[2]);
  }

  return attributes;
};

const emuToPercent = (value: number, total: number) => (total ? (value / total) * 100 : 0);

const getTransformStyle = (xml: string, slideWidth: number, slideHeight: number) => {
  const off = xml.match(/<a:off\b[^>]*>/)?.[0];
  const ext = xml.match(/<a:ext\b[^>]*>/)?.[0];
  const offAttrs = off ? readTagAttributes(off) : new Map<string, string>();
  const extAttrs = ext ? readTagAttributes(ext) : new Map<string, string>();
  const x = Number(offAttrs.get('x') || 0);
  const y = Number(offAttrs.get('y') || 0);
  const cx = Number(extAttrs.get('cx') || slideWidth);
  const cy = Number(extAttrs.get('cy') || slideHeight);

  return [
    `left:${emuToPercent(x, slideWidth)}%;`,
    `top:${emuToPercent(y, slideHeight)}%;`,
    `width:${emuToPercent(cx, slideWidth)}%;`,
    `height:${emuToPercent(cy, slideHeight)}%;`,
  ].join('');
};

const getColorFromXml = (xml: string, fallback = 'transparent') => {
  const color = xml.match(/<a:srgbClr\b[^>]*val="([^"]+)"/)?.[1];
  return color ? `#${color}` : fallback;
};

const getShapeFill = (xml: string) => {
  if (/<a:noFill\/>/.test(xml)) return 'transparent';
  return getColorFromXml(xml, 'transparent');
};

const getTextRuns = (xml: string) => {
  const paragraphs = xml.match(/<a:p\b[\s\S]*?<\/a:p>/g) || [];

  return paragraphs.map((paragraph) => {
    const runs = paragraph.match(/<a:r\b[\s\S]*?<\/a:r>/g) || [];
    const content = runs.map((run) => {
      const text = run.match(/<a:t>([\s\S]*?)<\/a:t>/)?.[1] || '';
      const rPr = run.match(/<a:rPr\b[^>]*>/)?.[0] || '';
      const attrs = readTagAttributes(rPr);
      const size = Number(attrs.get('sz') || 0);
      const fontSize = size ? `font-size:${size / 100}pt;` : '';
      const fontWeight = attrs.get('b') === '1' ? 'font-weight:700;' : '';
      const fontStyle = attrs.get('i') === '1' ? 'font-style:italic;' : '';
      const color = getColorFromXml(run, '#111827');

      return `<span style="${fontSize}${fontWeight}${fontStyle}color:${color};">${escapeHtml(text)}</span>`;
    }).join('');

    return content ? `<p>${content}</p>` : '';
  }).join('');
};

const buildPptxSlides = async (fileData: string) => {
  const { default: JSZip } = await import('jszip');
  const zip = await JSZip.loadAsync(await dataUrlToArrayBuffer(fileData));
  const presentationXml = await zip.file('ppt/presentation.xml')?.async('text');
  const slideSizeTag = presentationXml?.match(/<p:sldSz\b[^>]*>/)?.[0] || '';
  const slideSizeAttrs = readTagAttributes(slideSizeTag);
  const slideWidth = Number(slideSizeAttrs.get('cx') || 9144000);
  const slideHeight = Number(slideSizeAttrs.get('cy') || 5143500);
  const slideFiles = Object.keys(zip.files)
    .filter((path) => /^ppt\/slides\/slide\d+\.xml$/.test(path))
    .sort((a, b) => Number(a.match(/slide(\d+)\.xml/)?.[1] || 0) - Number(b.match(/slide(\d+)\.xml/)?.[1] || 0));

  const slides = await Promise.all(slideFiles.map(async (slidePath, index) => {
    const slideXml = await zip.file(slidePath)?.async('text');
    if (!slideXml) return '';

    const relsPath = slidePath.replace('ppt/slides/', 'ppt/slides/_rels/') + '.rels';
    const relsXml = await zip.file(relsPath)?.async('text');
    const relationships = new Map<string, string>();

    relsXml?.match(/<Relationship\b[^>]*>/g)?.forEach((tag) => {
      const id = tag.match(/\bId="([^"]+)"/)?.[1];
      const target = tag.match(/\bTarget="([^"]+)"/)?.[1];

      if (id && target) {
        relationships.set(id, target.startsWith('../') ? `ppt/${target.slice(3)}` : `ppt/slides/${target}`);
      }
    });

    const background = getColorFromXml(slideXml.match(/<p:bg[\s\S]*?<\/p:bg>/)?.[0] || '', '#ffffff');
    const shapes = (slideXml.match(/<p:sp\b[\s\S]*?<\/p:sp>/g) || []).map((shape) => {
      const textHtml = getTextRuns(shape);
      const fill = getShapeFill(shape.match(/<p:spPr\b[\s\S]*?<\/p:spPr>/)?.[0] || '');
      const style = `${getTransformStyle(shape, slideWidth, slideHeight)}background:${fill};`;

      if (!textHtml && fill === 'transparent') return '';

      return `<div class="ppt-shape" style="${style}">${textHtml}</div>`;
    });

    const pictures = await Promise.all((slideXml.match(/<p:pic\b[\s\S]*?<\/p:pic>/g) || []).map(async (picture) => {
      const relId = picture.match(/r:embed="([^"]+)"/)?.[1];
      const target = relId ? relationships.get(relId) : null;
      const imageFile = target ? zip.file(target) : null;

      if (!target || !imageFile) return '';

      const base64 = await imageFile.async('base64');
      return `<img class="ppt-picture" style="${getTransformStyle(picture, slideWidth, slideHeight)}" src="data:${getImageMimeType(target)};base64,${base64}" alt="Imagen de la diapositiva" />`;
    }));

    return `
      <article class="ppt-slide" style="background:${background};">
        <div class="ppt-slide-number">Diapositiva ${index + 1}</div>
        ${shapes.filter(Boolean).join('')}
        ${pictures.filter(Boolean).join('')}
      </article>
    `;
  }));

  return slides.filter(Boolean).join('');
};

export default function MaterialViewerPage() {
  const [material, setMaterial] = useState<StoredMaterial | null>(null);
  const [objectUrl, setObjectUrl] = useState('');
  const [pptxHtml, setPptxHtml] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const docxContainerRef = useRef<HTMLDivElement | null>(null);

  const previewKind = useMemo(
    () => getPreviewKind(material?.fileName, material?.fileData),
    [material?.fileData, material?.fileName],
  );

  useEffect(() => {
    const loadMaterial = async () => {
      const params = new URLSearchParams(window.location.search);
      const contentId = params.get('contentId');
      const id = params.get('id');

      if (contentId) {
        try {
          const token = typeof window !== 'undefined' ? localStorage.getItem('nuevaschool_token') : null;
          const res = await fetch('/api/contenidos/', {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
          });
          if (res.ok) {
            const contenidos = await res.json();
            const contenido = contenidos.find((item: any) => item.id === contentId);
            if (contenido && contenido.archivo_url) {
              setMaterial({
                fileName: contenido.titulo || 'Documento adjunto',
                fileData: contenido.archivo_url,
                downloadName: contenido.titulo || 'material',
              });
              return;
            }
          }
        } catch (fetchErr) {
          console.warn('Error fetching material from API, falling back to localforage:', fetchErr);
        }

        // Fallback to localforage
        localforage.config({ name: 'NuevaSchoolDB', storeName: 'appstate' });
        const appState = await localforage.getItem<AppState>('nuevaschool_appstate_v2');
        const contenido = appState?.contenidos?.find((item) => item.id === contentId);

        if (!contenido?.archivo) {
          setError('No se encontró el material solicitado.');
          setIsLoading(false);
          return;
        }

        setMaterial({
          fileName: contenido.nombre_archivo || 'Documento adjunto',
          fileData: contenido.archivo,
          downloadName: contenido.nombre_archivo || 'material',
        });
        return;
      }

      if (!id) {
        setError('No se encontró el material solicitado.');
        setIsLoading(false);
        return;
      }

      const rawMaterial = sessionStorage.getItem(id);

      if (!rawMaterial) {
        setError('El material ya no está disponible en esta pestaña.');
        setIsLoading(false);
        return;
      }

      setMaterial(JSON.parse(rawMaterial) as StoredMaterial);
    };

    loadMaterial();
  }, []);

  useEffect(() => {
    if (!material) return;

    let revokedUrl = '';

    const preparePreview = async () => {
      setIsLoading(true);
      setError('');

      try {
        const blob = await dataUrlToBlob(material.fileData);
        setObjectUrl('');
        setPptxHtml('');

        if (previewKind === 'docx') {
          if (!docxContainerRef.current) return;
          docxContainerRef.current.innerHTML = '';
          await renderAsync(blob, docxContainerRef.current, undefined, {
            className: 'docx',
            inWrapper: true,
            ignoreWidth: false,
            ignoreHeight: false,
            ignoreFonts: false,
            breakPages: true,
            ignoreLastRenderedPageBreak: false,
            experimental: true,
            renderHeaders: true,
            renderFooters: true,
            renderFootnotes: true,
            renderEndnotes: true,
          });
        } else if (previewKind === 'pptx') {
          setPptxHtml(await buildPptxSlides(material.fileData));
        } else {
          revokedUrl = URL.createObjectURL(blob);
          setObjectUrl(revokedUrl);
        }
      } catch (previewError) {
        setError('No se pudo generar la vista previa de este archivo.');
      } finally {
        setIsLoading(false);
      }
    };

    preparePreview();

    return () => {
      if (revokedUrl) URL.revokeObjectURL(revokedUrl);
    };
  }, [material, previewKind]);

  const title = material?.fileName || 'Vista previa del material';

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="sticky top-0 z-10 flex flex-col gap-3 border-b bg-blue-900 px-6 py-4 text-white shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 shrink-0" />
            <h1 className="truncate text-lg font-bold">{title}</h1>
          </div>
          <p className="mt-1 text-sm text-blue-100">Vista previa del material</p>
        </div>

        {material && (
          <Button variant="secondary" asChild>
            <a href={material.fileData} download={material.downloadName}>
              <DownloadCloud className="mr-2 h-4 w-4" />
              Descargar material
            </a>
          </Button>
        )}
      </header>

      <section className="p-4 sm:p-6">
        {isLoading && (
          <div className="mx-auto flex min-h-[360px] max-w-5xl items-center justify-center rounded-lg border bg-white text-gray-500">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Preparando vista previa...
          </div>
        )}

        {!isLoading && error && (
          <div className="mx-auto flex min-h-[360px] max-w-3xl flex-col items-center justify-center gap-3 rounded-lg border bg-white p-8 text-center text-gray-600">
            <AlertCircle className="h-8 w-8 text-amber-600" />
            <p className="font-medium">{error}</p>
            <p className="text-sm">Puedes descargar el archivo para verlo con una aplicación compatible.</p>
          </div>
        )}

        {!error && material && previewKind === 'pdf' && objectUrl && (
          <iframe src={objectUrl} title={title} className="h-[calc(100vh-130px)] w-full rounded-lg border bg-white" />
        )}

        {!error && material && previewKind === 'image' && objectUrl && (
          <div className="mx-auto max-w-6xl rounded-lg border bg-white p-4">
            <img src={objectUrl} alt={title} className="mx-auto max-h-[calc(100vh-170px)] max-w-full object-contain" />
          </div>
        )}

        {!error && material && previewKind === 'video' && objectUrl && (
          <video src={objectUrl} controls autoPlay className="mx-auto max-h-[calc(100vh-150px)] w-full max-w-6xl rounded-lg bg-black" />
        )}

        {!error && material && previewKind === 'audio' && objectUrl && (
          <div className="mx-auto max-w-4xl rounded-lg border bg-white p-8">
            <audio src={objectUrl} controls autoPlay className="w-full" />
          </div>
        )}

        {!error && material && previewKind === 'text' && objectUrl && (
          <iframe src={objectUrl} title={title} className="h-[calc(100vh-130px)] w-full rounded-lg border bg-white" />
        )}

        {!error && material && previewKind === 'docx' && (
          <div className="docx-viewer overflow-auto rounded-lg border bg-neutral-700 p-4">
            <div ref={docxContainerRef} />
          </div>
        )}

        {!error && material && previewKind === 'pptx' && (
          <div className="pptx-viewer mx-auto max-w-6xl space-y-6">
            {pptxHtml ? <div dangerouslySetInnerHTML={{ __html: pptxHtml }} /> : (
              <div className="rounded-lg border bg-white p-8 text-center text-gray-600">
                No se encontraron diapositivas para previsualizar.
              </div>
            )}
          </div>
        )}

        {!error && material && previewKind === 'unsupported' && (
          <div className="mx-auto flex min-h-[360px] max-w-3xl flex-col items-center justify-center gap-3 rounded-lg border bg-white p-8 text-center text-gray-600">
            <AlertCircle className="h-8 w-8 text-amber-600" />
            <p className="font-medium">Este formato no se puede previsualizar directamente en el navegador.</p>
            <p className="text-sm">Usa la opción de descarga para abrirlo con una aplicación compatible.</p>
          </div>
        )}
      </section>
      <style jsx global>{`
        .docx-viewer .docx-wrapper {
          background: transparent !important;
          padding: 0 !important;
        }

        .docx-viewer section.docx {
          margin: 0 auto 18px !important;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.35);
        }

        .docx-viewer section.docx:last-child {
          margin-bottom: 0 !important;
        }

        .docx-viewer .docx-page-break {
          display: block !important;
          height: 18px !important;
          background: #404040 !important;
        }

        .pptx-viewer .ppt-slide {
          aspect-ratio: 16 / 9;
          background: white;
          border: 1px solid #d1d5db;
          border-radius: 10px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.28);
          overflow: hidden;
          padding: 28px;
          position: relative;
        }

        .pptx-viewer .ppt-slide-number {
          color: #64748b;
          font-size: 12px;
          font-weight: 700;
          margin-bottom: 16px;
          position: relative;
          z-index: 3;
          text-transform: uppercase;
        }

        .pptx-viewer .ppt-shape {
          box-sizing: border-box;
          color: #111827;
          overflow: hidden;
          padding: 6px;
          position: absolute;
          z-index: 2;
        }

        .pptx-viewer .ppt-shape p {
          line-height: 1.35;
          margin: 0 0 0.3em;
        }

        .pptx-viewer .ppt-picture {
          object-fit: contain;
          position: absolute;
          z-index: 1;
        }
      `}</style>
    </main>
  );
}
