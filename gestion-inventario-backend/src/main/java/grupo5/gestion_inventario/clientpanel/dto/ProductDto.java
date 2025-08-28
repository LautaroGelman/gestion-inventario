// backend/src/main/java/grupo5/gestion_inventario/clientpanel/dto/ProductDto.java
package grupo5.gestion_inventario.clientpanel.dto;

import java.math.BigDecimal;

public record ProductDto(
        Long id,
        String code,
        String name,
        String description,
        Integer quantity,
        BigDecimal cost,
        BigDecimal price,
        Integer lowStockThreshold,
        Integer reorderQtyDefault,
        Long preferredProviderId,
        String preferredProviderName
) {}
