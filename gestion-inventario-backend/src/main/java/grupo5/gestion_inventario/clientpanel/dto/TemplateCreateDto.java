package grupo5.gestion_inventario.clientpanel.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

/** Alta de plantilla de gasto recurrente o único. */
public record TemplateCreateDto(
        Long        categoryId,
        BigDecimal  amount,
        boolean     recurring,
        LocalDate   effectiveFrom,
        String      description
) {}
