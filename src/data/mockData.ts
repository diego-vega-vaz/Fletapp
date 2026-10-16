// Este archivo solo conserva el formateador de dinero.
//
// Tenia ademas SHIPMENTS, QUOTES, TIMELINE, INVOICES y TICKET de ejemplo que
// no importaba ningun modulo: codigo muerto que de todos modos viajaba al
// bundle, con una tarjeta "Visa ****4242" y un "Credito FleetWeb" dentro.
// Se borraron el 16 oct 2026 junto con la limpieza de la pantalla de pago.

// Formateador de dinero unico de la app. Todo en FleetWeb se cobra en PESOS MEXICANOS.
// Si algun dia hay otra moneda, se agrega un parametro aqui, no una funcion paralela.
export const fmtMXN = (n: number) => '$' + n.toLocaleString('es-MX', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })
