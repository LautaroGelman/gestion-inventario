package grupo5.gestion_inventario.clientpanel.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

/** Edición parcial de plantilla (campos null se dejan intactos). */
public record TemplateUpdateDto(
        BigDecimal  amount,
        Boolean     recurring,
        LocalDate   effectiveFrom,
        String      description
) {}
