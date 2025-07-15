// src/main/java/grupo5/gestion_inventario/clientpanel/dto/ReturnItemDto.java
package grupo5.gestion_inventario.clientpanel.dto;

/**

 DTO de detalle de item en una devolución.
 */
public record ReturnItemDto(
        Long saleReturnItemId,  // ID del registro sale_return_item
        Long saleItemId,        // ID del item original vendido
        int quantity,            // Cantidad devuelta
        java.math.BigDecimal unitPrice) {}