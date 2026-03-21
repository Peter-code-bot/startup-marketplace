export const metadata = { title: "Aviso de Privacidad" };

export default function PrivacidadPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 prose dark:prose-invert">
      <h1>Aviso de Privacidad</h1>
      <p className="text-muted-foreground">
        Última actualización: Marzo 2026
      </p>

      <h2>1. Responsable del tratamiento</h2>
      <p>
        VICINO, con domicilio en México, es responsable del tratamiento de tus
        datos personales conforme a la Ley Federal de Protección de Datos
        Personales en Posesión de los Particulares (LFPDPPP).
      </p>

      <h2>2. Datos que recopilamos</h2>
      <ul>
        <li>Nombre, correo electrónico y foto de perfil</li>
        <li>Número de teléfono (opcional, para verificación)</li>
        <li>Documentos de identidad (INE) para verificación de vendedores</li>
        <li>Ubicación aproximada (opcional)</li>
        <li>Historial de publicaciones, ventas y reseñas</li>
      </ul>

      <h2>3. Finalidad</h2>
      <p>
        Tus datos se utilizan para: crear y gestionar tu cuenta, facilitar la
        comunicación entre compradores y vendedores, verificar identidad,
        mejorar la seguridad de la plataforma y enviarte notificaciones
        relevantes.
      </p>

      <h2>4. Derechos ARCO</h2>
      <p>
        Tienes derecho a Acceder, Rectificar, Cancelar u Oponerte al
        tratamiento de tus datos personales. Para ejercer estos derechos,
        contáctanos a través de la plataforma.
      </p>

      <h2>5. Seguridad</h2>
      <p>
        Implementamos medidas de seguridad técnicas y organizativas para
        proteger tus datos. Los documentos de verificación se almacenan de forma
        segura y solo son accesibles por administradores autorizados.
      </p>
    </div>
  );
}
