package grupo5.gestion_inventario.clientpanel.dto;

import java.math.BigDecimal;
import java.util.List;

public class FlujoCajaDTO {

    private BigDecimal saldoInicial;
    private BigDecimal entradas;
    private BigDecimal salidas;
    private BigDecimal saldoFinal;
    private List<MovimientoCajaDTO> movimientos;

    // Clase anidada para el detalle de movimientos
    public static class MovimientoCajaDTO {
        private String fecha;
        private String descripcion;
        private String categoria;
        private BigDecimal monto;

        // Getters y Setters para MovimientoCajaDTO
        public String getFecha() { return fecha; }
        public void setFecha(String fecha) { this.fecha = fecha; }
        public String getDescripcion() { return descripcion; }
        public void setDescripcion(String descripcion) { this.descripcion = descripcion; }
        public String getCategoria() { return categoria; }
        public void setCategoria(String categoria) { this.categoria = categoria; }
        public BigDecimal getMonto() { return monto; }
        public void setMonto(BigDecimal monto) { this.monto = monto; }
    }

    // Getters y Setters para FlujoCajaDTO
    public BigDecimal getSaldoInicial() { return saldoInicial; }
    public void setSaldoInicial(BigDecimal saldoInicial) { this.saldoInicial = saldoInicial; }
    public BigDecimal getEntradas() { return entradas; }
    public void setEntradas(BigDecimal entradas) { this.entradas = entradas; }
    public BigDecimal getSalidas() { return salidas; }
    public void setSalidas(BigDecimal salidas) { this.salidas = salidas; }
    public BigDecimal getSaldoFinal() { return saldoFinal; }
    public void setSaldoFinal(BigDecimal saldoFinal) { this.saldoFinal = saldoFinal; }
    public List<MovimientoCajaDTO> getMovimientos() { return movimientos; }
    public void setMovimientos(List<MovimientoCajaDTO> movimientos) { this.movimientos = movimientos; }
}