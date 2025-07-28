package grupo5.gestion_inventario.clientpanel.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public class EstadoResultadosDTO {

    private BigDecimal ingresosPorVentas;
    private BigDecimal costoMercaderiaVendida;
    private BigDecimal margenBruto;
    private BigDecimal gastosOperativos;
    private BigDecimal utilidadOperativa;
    private Map<String, BigDecimal> detalleGastos; // Para desglosar los gastos

    // Constructores, Getters y Setters

    public EstadoResultadosDTO() {
    }

    public BigDecimal getIngresosPorVentas() {
        return ingresosPorVentas;
    }

    public void setIngresosPorVentas(BigDecimal ingresosPorVentas) {
        this.ingresosPorVentas = ingresosPorVentas;
    }

    public BigDecimal getCostoMercaderiaVendida() {
        return costoMercaderiaVendida;
    }

    public void setCostoMercaderiaVendida(BigDecimal costoMercaderiaVendida) {
        this.costoMercaderiaVendida = costoMercaderiaVendida;
    }

    public BigDecimal getMargenBruto() {
        return margenBruto;
    }

    public void setMargenBruto(BigDecimal margenBruto) {
        this.margenBruto = margenBruto;
    }

    public BigDecimal getGastosOperativos() {
        return gastosOperativos;
    }

    public void setGastosOperativos(BigDecimal gastosOperativos) {
        this.gastosOperativos = gastosOperativos;
    }

    public BigDecimal getUtilidadOperativa() {
        return utilidadOperativa;
    }

    public void setUtilidadOperativa(BigDecimal utilidadOperativa) {
        this.utilidadOperativa = utilidadOperativa;
    }

    public Map<String, BigDecimal> getDetalleGastos() {
        return detalleGastos;
    }

    public void setDetalleGastos(Map<String, BigDecimal> detalleGastos) {
        this.detalleGastos = detalleGastos;
    }
}