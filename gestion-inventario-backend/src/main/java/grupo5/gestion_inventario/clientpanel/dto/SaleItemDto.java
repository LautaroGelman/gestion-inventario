// src/main/java/grupo5/gestion_inventario/clientpanel/dto/SaleItemDto.java
package grupo5.gestion_inventario.clientpanel.dto;

import java.math.BigDecimal;

/**
 * DTO de un ítem de venta, usado al devolver detalles de la venta.
 */
public record SaleItemDto(
        Long       saleItemId,  // id del registro en sale_item
        Long       productId,   // id del producto
        int        quantity,    // unidades vendidas
        BigDecimal unitPrice    // precio unitario al momento de la venta
) {}
