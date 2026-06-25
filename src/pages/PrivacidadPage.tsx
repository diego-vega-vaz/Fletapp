import type { PublicRoute } from '../types'
import { Icon } from '../components/ui/Icon'

interface Props {
  go: (r: PublicRoute) => void
}

const backBtn: React.CSSProperties = {
  color: 'var(--primary)',
  fontSize: 13.5,
  fontWeight: 600,
  display: 'flex',
  alignItems: 'center',
  gap: 4,
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  marginBottom: 20,
  padding: 0,
}

const h1: React.CSSProperties = {
  fontSize: 30,
  fontWeight: 800,
  color: 'var(--text-strong)',
  letterSpacing: '-0.02em',
  marginBottom: 8,
}

const updated: React.CSSProperties = {
  fontSize: 13,
  color: 'var(--text-faint)',
  marginBottom: 32,
}

const h2: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 700,
  color: 'var(--text-strong)',
  marginTop: 28,
  marginBottom: 10,
}

const p: React.CSSProperties = {
  fontSize: 14.5,
  color: 'var(--text-muted)',
  lineHeight: 1.7,
  marginBottom: 12,
}

const li: React.CSSProperties = {
  fontSize: 14.5,
  color: 'var(--text-muted)',
  lineHeight: 1.7,
}

export function PrivacidadPage({ go }: Props) {
  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '48px 28px' }}>
      <button onClick={() => go('landing')} style={backBtn}>
        <Icon name="arrowLeft" size={16} />
        Volver
      </button>

      <h1 style={h1}>Aviso de Privacidad</h1>
      <p style={updated}>Última actualización: 25 de junio de 2026</p>

      <p style={p}>
        En cumplimiento de la Ley Federal de Protección de Datos Personales en Posesión de los
        Particulares (LFPDPPP), su Reglamento y demás disposiciones aplicables, ponemos a su
        disposición el presente Aviso de Privacidad.
      </p>

      <h2 style={h2}>1. Identidad y domicilio del responsable</h2>
      <p style={p}>
        FletApp ("el Responsable"), con domicilio en la Ciudad de México, México, es responsable
        del tratamiento, uso y protección de los datos personales que usted nos proporcione a
        través de nuestra plataforma de logística de flete terrestre.
      </p>

      <h2 style={h2}>2. Datos personales que recabamos</h2>
      <p style={p}>
        Para las finalidades señaladas en este aviso, podremos recabar los siguientes datos
        personales, ya sea de manera directa cuando usted los proporciona, o de forma automática
        durante su uso de la Plataforma:
      </p>
      <ul style={{ marginBottom: 12, paddingLeft: 20 }}>
        <li style={li}>Datos de identificación y contacto: nombre, correo electrónico y teléfono.</li>
        <li style={li}>Datos fiscales: RFC y razón social.</li>
        <li style={li}>Datos relativos a los envíos: origen, destino, tipo de carga y documentación asociada.</li>
      </ul>
      <p style={p}>
        Le informamos que no recabamos datos personales sensibles para la prestación de nuestros
        servicios.
      </p>

      <h2 style={h2}>3. Finalidades del tratamiento</h2>
      <p style={p}>Sus datos personales serán utilizados para las siguientes finalidades primarias, necesarias para el servicio:</p>
      <ul style={{ marginBottom: 12, paddingLeft: 20 }}>
        <li style={li}>Prestar los servicios de cotización, agendamiento, rastreo y gestión de envíos.</li>
        <li style={li}>Realizar la facturación y el cobro de los servicios contratados.</li>
        <li style={li}>Brindar atención, soporte y seguimiento a sus solicitudes.</li>
      </ul>
      <p style={p}>De manera adicional, utilizamos sus datos para las siguientes finalidades secundarias, que no son necesarias para el servicio:</p>
      <ul style={{ marginBottom: 12, paddingLeft: 20 }}>
        <li style={li}>Envío de comunicaciones, promociones y contenido de marketing.</li>
        <li style={li}>Elaboración de estudios y análisis para mejorar nuestros servicios.</li>
      </ul>
      <p style={p}>
        Si usted no desea que sus datos sean tratados para las finalidades secundarias, puede
        manifestarlo enviando un correo a privacidad@fletapp.mx. La negativa para estas finalidades
        no será motivo para negarle los servicios contratados.
      </p>

      <h2 style={h2}>4. Transferencia de datos</h2>
      <p style={p}>
        Sus datos personales podrán ser transferidos a transportistas y proveedores de servicios de
        pago, en la medida en que ello sea necesario para la prestación del servicio, la ejecución
        del envío y el procesamiento de los cobros correspondientes. Estas transferencias no
        requieren de su consentimiento conforme al artículo 37 de la LFPDPPP. No transferimos sus
        datos a terceros con fines distintos sin su consentimiento, salvo en los casos previstos por
        la ley.
      </p>

      <h2 style={h2}>5. Uso de cookies y tecnologías</h2>
      <p style={p}>
        Nuestra Plataforma utiliza cookies y otras tecnologías de rastreo para mejorar su
        experiencia, recordar sus preferencias, mantener su sesión activa y obtener información
        estadística sobre el uso del sitio. Usted puede deshabilitar el uso de cookies desde la
        configuración de su navegador, considerando que ello podría afectar algunas funciones de la
        Plataforma.
      </p>

      <h2 style={h2}>6. Derechos ARCO</h2>
      <p style={p}>
        Usted tiene derecho a conocer qué datos personales tenemos, para qué los utilizamos y las
        condiciones del uso que les damos (Acceso). Asimismo, es su derecho solicitar la corrección
        de su información personal en caso de que esté desactualizada, sea inexacta o incompleta
        (Rectificación); que la eliminemos de nuestros registros o bases de datos cuando considere
        que no está siendo utilizada conforme a la normatividad (Cancelación); así como oponerse al
        uso de sus datos personales para fines específicos (Oposición).
      </p>
      <p style={p}>
        Para ejercer cualquiera de los derechos ARCO, deberá enviar su solicitud al correo
        electrónico privacidad@fletapp.mx, indicando su nombre, los datos sobre los que desea
        ejercer alguno de los derechos y la descripción clara y precisa de su solicitud. Daremos
        respuesta en los plazos establecidos por la ley.
      </p>

      <h2 style={h2}>7. Seguridad de la información</h2>
      <p style={p}>
        FletApp implementa medidas de seguridad administrativas, técnicas y físicas razonables para
        proteger sus datos personales contra daño, pérdida, alteración, destrucción o uso, acceso o
        tratamiento no autorizados. No obstante, ningún sistema es completamente infalible, por lo
        que no podemos garantizar una seguridad absoluta.
      </p>

      <h2 style={h2}>8. Cambios al aviso</h2>
      <p style={p}>
        El presente Aviso de Privacidad puede sufrir modificaciones, cambios o actualizaciones
        derivadas de nuevos requerimientos legales, de nuestras propias necesidades o de nuestras
        prácticas de privacidad. Cualquier modificación será publicada en nuestra Plataforma.
      </p>

      <h2 style={h2}>9. Contacto</h2>
      <p style={p}>
        Si tiene preguntas o comentarios sobre este Aviso de Privacidad o sobre el tratamiento de
        sus datos personales, puede contactarnos en el correo electrónico privacidad@fletapp.mx.
      </p>
    </div>
  )
}
