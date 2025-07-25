// src/main/java/grupo5/gestion_inventario/clientpanel/dto/SaleDto.java
package grupo5.gestion_inventario.clientpanel.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO de venta para el panel del cliente.
 */
public record SaleDto(
        Long            id,
        String          cliente,
        int             quantity,       // unidades totales de la venta
        BigDecimal      totalAmount,    // importe total
        String          paymentMethod,  // método de pago
        LocalDateTime   fecha,          // fecha-hora de creación
        List<SaleItemDto> items         // lista de ítems de la venta
) {}
