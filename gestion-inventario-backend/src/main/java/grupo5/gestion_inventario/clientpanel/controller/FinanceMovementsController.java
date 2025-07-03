package grupo5.gestion_inventario.clientpanel.controller;

import grupo5.gestion_inventario.clientpanel.dto.ExpenseMovementDto;
import grupo5.gestion_inventario.service.FinanceMovementsService;
import java.time.LocalDate;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/client-panel/{clientId}/finance/movements")
@RequiredArgsConstructor
public class FinanceMovementsController {

    private final FinanceMovementsService svc;

    @GetMapping
    public List<ExpenseMovementDto> movements(
            @PathVariable Long clientId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return svc.findMovements(clientId, from, to);
    }
}
