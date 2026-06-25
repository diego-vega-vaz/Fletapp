// Catálogos del SAT para facturación CFDI 4.0 (subconjunto más usado)

export interface SatOption { code: string; label: string }

// Régimen fiscal (catálogo c_RegimenFiscal)
export const REGIMENES_FISCALES: SatOption[] = [
  { code: '601', label: '601 · General de Ley Personas Morales' },
  { code: '603', label: '603 · Personas Morales con Fines no Lucrativos' },
  { code: '605', label: '605 · Sueldos y Salarios e Ingresos Asimilados a Salarios' },
  { code: '606', label: '606 · Arrendamiento' },
  { code: '607', label: '607 · Régimen de Enajenación o Adquisición de Bienes' },
  { code: '608', label: '608 · Demás ingresos' },
  { code: '610', label: '610 · Residentes en el Extranjero sin Establecimiento en México' },
  { code: '611', label: '611 · Ingresos por Dividendos (socios y accionistas)' },
  { code: '612', label: '612 · Personas Físicas con Actividades Empresariales y Profesionales' },
  { code: '614', label: '614 · Ingresos por intereses' },
  { code: '616', label: '616 · Sin obligaciones fiscales' },
  { code: '620', label: '620 · Sociedades Cooperativas de Producción' },
  { code: '621', label: '621 · Incorporación Fiscal' },
  { code: '622', label: '622 · Actividades Agrícolas, Ganaderas, Silvícolas y Pesqueras' },
  { code: '625', label: '625 · Régimen de las Actividades Empresariales con ingresos a través de Plataformas Tecnológicas' },
  { code: '626', label: '626 · Régimen Simplificado de Confianza (RESICO)' },
]

// Uso del CFDI (catálogo c_UsoCFDI)
export const USOS_CFDI: SatOption[] = [
  { code: 'G01', label: 'G01 · Adquisición de mercancías' },
  { code: 'G02', label: 'G02 · Devoluciones, descuentos o bonificaciones' },
  { code: 'G03', label: 'G03 · Gastos en general' },
  { code: 'I01', label: 'I01 · Construcciones' },
  { code: 'I02', label: 'I02 · Mobiliario y equipo de oficina por inversiones' },
  { code: 'I04', label: 'I04 · Equipo de cómputo y accesorios' },
  { code: 'I08', label: 'I08 · Otra maquinaria y equipo' },
  { code: 'D01', label: 'D01 · Honorarios médicos, dentales y gastos hospitalarios' },
  { code: 'D10', label: 'D10 · Pagos por servicios educativos (colegiaturas)' },
  { code: 'S01', label: 'S01 · Sin efectos fiscales' },
  { code: 'CP01', label: 'CP01 · Pagos' },
]
