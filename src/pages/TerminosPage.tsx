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

export function TerminosPage({ go }: Props) {
  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '48px 28px' }}>
      <button onClick={() => go('landing')} style={backBtn}>
        <Icon name="arrowLeft" size={16} />
        Volver
      </button>

      <h1 style={h1}>Términos y Condiciones</h1>
      <p style={updated}>Última actualización: 25 de junio de 2026</p>

      <h2 style={h2}>1. Aceptación de los términos</h2>
      <p style={p}>
        Al acceder y utilizar FleetApp (la "Plataforma"), usted ("el Usuario") acepta quedar
        obligado por los presentes Términos y Condiciones, así como por nuestro Aviso de
        Privacidad. Si no está de acuerdo con cualquiera de las disposiciones aquí establecidas,
        deberá abstenerse de usar la Plataforma. El uso continuado de FleetApp constituye su
        aceptación expresa de estos términos y de las actualizaciones que se publiquen.
      </p>

      <h2 style={h2}>2. Descripción del servicio</h2>
      <p style={p}>
        FleetApp es una plataforma tecnológica que permite a los Usuarios cotizar, agendar,
        rastrear y facturar envíos de flete terrestre en México. FleetApp actúa exclusivamente
        como un intermediario tecnológico que conecta a los Usuarios con transportistas
        independientes; no presta directamente el servicio de transporte de carga ni es propietario
        ni operador de las unidades.
      </p>
      <p style={p}>
        En consecuencia, la relación de transporte se establece entre el Usuario y el
        transportista correspondiente. FleetApp no garantiza la disponibilidad permanente de
        transportistas ni se hace responsable de los actos u omisiones de éstos, salvo en lo
        expresamente previsto en estos términos.
      </p>

      <h2 style={h2}>3. Registro y cuenta</h2>
      <p style={p}>
        Para utilizar ciertas funciones de la Plataforma, el Usuario debe crear una cuenta
        proporcionando información veraz, completa y actualizada. El Usuario es responsable de
        mantener la confidencialidad de sus credenciales de acceso y de toda actividad que ocurra
        bajo su cuenta.
      </p>
      <ul style={{ marginBottom: 12, paddingLeft: 20 }}>
        <li style={li}>Debe ser mayor de edad y contar con capacidad legal para contratar.</li>
        <li style={li}>Notificará de inmediato cualquier uso no autorizado de su cuenta.</li>
        <li style={li}>No podrá ceder ni transferir su cuenta a terceros sin autorización.</li>
      </ul>

      <h2 style={h2}>4. Planes y pagos</h2>
      <p style={p}>
        FleetApp ofrece distintos planes de suscripción: Gratis, Pro y Empresa. Los planes de pago
        se cobran de forma mensual en pesos mexicanos (MXN), más el Impuesto al Valor Agregado
        (IVA) aplicable. Salvo cancelación previa, la suscripción se renueva automáticamente al
        inicio de cada periodo, cargándose el monto correspondiente al método de pago registrado.
      </p>
      <p style={p}>
        El Usuario puede cancelar su suscripción en cualquier momento desde la configuración de su
        cuenta; la cancelación surtirá efecto al término del periodo ya pagado, sin que proceda la
        devolución proporcional de pagos efectuados, salvo disposición legal en contrario.
      </p>

      <h2 style={h2}>5. Obligaciones del usuario</h2>
      <p style={p}>El Usuario se obliga a:</p>
      <ul style={{ marginBottom: 12, paddingLeft: 20 }}>
        <li style={li}>Utilizar la Plataforma conforme a la ley y a estos términos.</li>
        <li style={li}>Proporcionar información veraz sobre la carga, origen, destino y condiciones del envío.</li>
        <li style={li}>No transportar mercancías prohibidas, ilícitas o peligrosas sin la debida declaración y permisos.</li>
        <li style={li}>Abstenerse de realizar conductas que afecten la seguridad o el funcionamiento de la Plataforma.</li>
      </ul>

      <h2 style={h2}>6. Cotizaciones y tarifas</h2>
      <p style={p}>
        Las cotizaciones generadas por la Plataforma son estimadas y se calculan con base en la
        información proporcionada por el Usuario y en las condiciones de mercado vigentes. Dichas
        cotizaciones pueden variar en función de factores como distancia real, peajes, tipo y peso
        de la carga, demanda, disponibilidad y otras circunstancias. El precio final será el
        confirmado al momento de agendar el envío.
      </p>

      <h2 style={h2}>7. Responsabilidad sobre la carga</h2>
      <p style={p}>
        El Usuario es responsable de la correcta descripción, embalaje, declaración de valor y
        documentación de la carga, incluyendo la Carta Porte cuando resulte exigible. FleetApp no
        asume responsabilidad por pérdidas, daños o retrasos atribuibles al transportista, al
        Usuario o a causas de fuerza mayor. Cualquier reclamación relacionada con la carga deberá
        gestionarse conforme a las pólizas de seguro y a la normatividad aplicable.
      </p>

      <h2 style={h2}>8. Limitación de responsabilidad</h2>
      <p style={p}>
        En la máxima medida permitida por la ley, FleetApp no será responsable por daños
        indirectos, incidentales, especiales o consecuenciales, ni por lucro cesante derivado del
        uso o imposibilidad de uso de la Plataforma. La responsabilidad total de FleetApp, en su
        caso, no excederá el monto pagado por el Usuario por concepto de suscripción durante los
        tres meses anteriores al evento que dé origen a la reclamación.
      </p>

      <h2 style={h2}>9. Propiedad intelectual</h2>
      <p style={p}>
        Todos los derechos de propiedad intelectual e industrial sobre la Plataforma, incluyendo
        software, marcas, logotipos, diseños, textos y contenidos, son propiedad de FleetApp o de
        sus licenciantes. Queda prohibida su reproducción, distribución o uso no autorizado. El uso
        de la Plataforma no concede al Usuario ningún derecho sobre dicha propiedad intelectual.
      </p>

      <h2 style={h2}>10. Terminación</h2>
      <p style={p}>
        FleetApp podrá suspender o cancelar el acceso del Usuario a la Plataforma, de manera total o
        parcial, en caso de incumplimiento de estos términos, uso fraudulento o por requerimiento
        legal. El Usuario podrá dar por terminada su relación con FleetApp cancelando su cuenta en
        cualquier momento.
      </p>

      <h2 style={h2}>11. Modificaciones</h2>
      <p style={p}>
        FleetApp se reserva el derecho de modificar estos Términos y Condiciones en cualquier
        momento. Las modificaciones serán publicadas en la Plataforma y entrarán en vigor a partir
        de su publicación. El uso continuado de FleetApp tras dichas modificaciones implica la
        aceptación de las mismas.
      </p>

      <h2 style={h2}>12. Ley aplicable y jurisdicción</h2>
      <p style={p}>
        Estos Términos y Condiciones se rigen por las leyes de los Estados Unidos Mexicanos. Para
        la interpretación y cumplimiento de los mismos, las partes se someten expresamente a la
        jurisdicción de los tribunales competentes de la Ciudad de México, renunciando a cualquier
        otro fuero que pudiera corresponderles por razón de su domicilio presente o futuro.
      </p>

      <h2 style={h2}>13. Contacto</h2>
      <p style={p}>
        Para cualquier duda, aclaración o notificación relacionada con estos Términos y
        Condiciones, puede comunicarse con nosotros al correo electrónico legal@fleetapp.mx.
      </p>
    </div>
  )
}
