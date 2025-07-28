package grupo5.gestion_inventario.clientpanel.dto;

import java.math.BigDecimal;

public class AnalisisGastosDTO {

    private String categoria;
    private BigDecimal monto;
    private double porcentaje;

    // Constructores, Getters y Setters

    public AnalisisGastosDTO(String categoria, BigDecimal monto, double porcentaje) {
        this.categoria = categoria;
        this.monto = monto;
        this.porcentaje = porcentaje;
    }

    public String getCategoria() {
        return categoria;
    }

    public void setCategoria(String categoria) {
        this.categoria = categoria;
    }

    public BigDecimal getMonto() {
        return monto;
    }

    public void setMonto(BigDecimal monto) {
        this.monto = monto;
    }

    public double getPorcentaje() {
        return porcentaje;
    }

    public void setPorcentaje(double porcentaje) {
        this.porcentaje = porcentaje;
    }
}