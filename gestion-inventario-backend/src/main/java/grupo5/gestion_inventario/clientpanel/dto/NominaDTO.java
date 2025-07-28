package grupo5.gestion_inventario.clientpanel.dto;

import java.math.BigDecimal;

public class NominaDTO {

    private BigDecimal costoTotalNomina;
    private BigDecimal totalHorasTrabajadas;
    private BigDecimal costoPromedioPorHora;
    private double costoLaboralSobreIngresos; // Porcentaje

    // Constructores, Getters y Setters

    public NominaDTO() {
    }

    public BigDecimal getCostoTotalNomina() {
        return costoTotalNomina;
    }

    public void setCostoTotalNomina(BigDecimal costoTotalNomina) {
        this.costoTotalNomina = costoTotalNomina;
    }

    public BigDecimal getTotalHorasTrabajadas() {
        return totalHorasTrabajadas;
    }

    public void setTotalHorasTrabajadas(BigDecimal totalHorasTrabajadas) {
        this.totalHorasTrabajadas = totalHorasTrabajadas;
    }

    public BigDecimal getCostoPromedioPorHora() {
        return costoPromedioPorHora;
    }

    public void setCostoPromedioPorHora(BigDecimal costoPromedioPorHora) {
        this.costoPromedioPorHora = costoPromedioPorHora;
    }

    public double getCostoLaboralSobreIngresos() {
        return costoLaboralSobreIngresos;
    }

    public void setCostoLaboralSobreIngresos(double costoLaboralSobreIngresos) {
        this.costoLaboralSobreIngresos = costoLaboralSobreIngresos;
    }
}
