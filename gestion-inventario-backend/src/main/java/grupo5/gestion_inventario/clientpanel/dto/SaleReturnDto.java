// src/main/java/grupo5/gestion_inventario/clientpanel/dto/SaleReturnDto.java
package grupo5.gestion_inventario.clientpanel.dto;

import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO de respuesta tras registrar una devolución.
 */
public record SaleReturnDto(
        Long saleReturnId,       // ID de la devolución creada
        Long saleId,             // ID de la venta original
        String reason,           // Motivo de devolución
        LocalDateTime returnedAt,// Fecha-hora de la devolución
        List<ReturnItemDto> items// Items devueltos
) {}
