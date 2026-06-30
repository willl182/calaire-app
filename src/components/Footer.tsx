export function Footer() {
  return (
    <footer className="app-footer">
      <div className="footer-content">
        <div className="footer-section">
          <h4>Proyecto</h4>
          <p>
            <em>Este aplicativo fue desarrollado en el marco del proyecto «Implementación de Ensayos de Aptitud en la Matriz Aire. Caso Gases Contaminantes Criterio»</em>
          </p>
        </div>
        <div className="footer-section">
          <h4>Instituciones</h4>
          <p>Laboratorio CALAIRE</p>
          <p>Universidad Nacional de Colombia — Sede Medellín</p>
          <p>Instituto Nacional de Metrología (INM)</p>
        </div>
        <div className="footer-section">
          <h4>Contacto</h4>
          <p>
            <a href="mailto:calaire_med@unal.edu.co">calaire_med@unal.edu.co</a>
          </p>
          <p>
            <a href="https://minas.medellin.unal.edu.co/laboratorios/calaire/" target="_blank" rel="noopener noreferrer">
              minas.medellin.unal.edu.co/laboratorios/calaire
            </a>
          </p>
        </div>
      </div>
      <div className="footer-bottom">
        <p>© 2026 Universidad Nacional de Colombia. Todos los derechos reservados.</p>
      </div>
    </footer>
  )
}