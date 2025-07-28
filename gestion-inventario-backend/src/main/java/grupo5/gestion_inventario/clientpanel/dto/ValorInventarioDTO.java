package grupo5.gestion_inventario.clientpanel.dto;

import java.math.BigDecimal;
import java.util.List;

public class ValorInventarioDTO {

    private BigDecimal valorTotalInventario;
    private List<ProductoValorizadoDTO> topProductosValorizados;

    // Clase anidada para el detalle de productos
    public static class ProductoValorizadoDTO {
        private String nombre;
        private int stockActual;
        private BigDecimal costoUnitario;
        private BigDecimal valorTotal;

        // Getters y Setters para ProductoValorizadoDTO
        public String getNombre() { return nombre; }
        public void setNombre(String nombre) { this.nombre = nombre; }
        public int getStockActual() { return stockActual; }
        public void setStockActual(int stockActual) { this.stockActual = stockActual; }
        public BigDecimal getCostoUnitario() { return costoUnitario; }
        public void setCostoUnitario(BigDecimal costoUnitario) { this.costoUnitario = costoUnitario; }
        public BigDecimal getValorTotal() { return valorTotal; }
        public void setValorTotal(BigDecimal valorTotal) { this.valorTotal = valorTotal; }
    }

    // Getters y Setters para ValorInventarioDTO
    public BigDecimal getValorTotalInventario() { return valorTotalInventario; }
    public void setValorTotalInventario(BigDecimal valorTotalInventario) { this.valorTotalInventario = valorTotalInventario; }
    public List<ProductoValorizadoDTO> getTopProductosValorizados() { return topProductosValorizados; }
    public void setTopProductosValorizados(List<ProductoValorizadoDTO> topProductosValorizados) { this.topProductosValorizados = topProductosValorizados; }
}