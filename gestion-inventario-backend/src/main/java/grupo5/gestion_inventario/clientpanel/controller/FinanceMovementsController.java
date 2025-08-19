// src/main/java/grupo5/gestion_inventario/clientpanel/controller/FinanceMovementsController.java
package grupo5.gestion_inventario.clientpanel.controller;

import grupo5.gestion_inventario.clientpanel.dto.ExpenseMovementDto;
import grupo5.gestion_inventario.model.Client;
import grupo5.gestion_inventario.model.Employee;
import grupo5.gestion_inventario.repository.EmployeeRepository;
import grupo5.gestion_inventario.service.FinanceMovementsService;
import java.time.LocalDate;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/client-panel/{clientId}/finance/movements")
@RequiredArgsConstructor
public class FinanceMovementsController {

    private final FinanceMovementsService svc;
    private final EmployeeRepository employeeRepo;

    /* -------- Validación de pertenencia al cliente (patrón actual) -------- */
    private Client validateClient(Long clientId, Authentication auth) {
        Employee emp = employeeRepo.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("Empleado no encontrado"));
        Client client = emp.getClient();
        if (!client.getId().equals(clientId)) {
            throw new AccessDeniedException("No autorizado para este cliente");
        }
        return client;
    }

    /** Listar movimientos financieros del cliente entre fechas (incluye ingresos/egresos) */
    @GetMapping
    @PreAuthorize("hasAnyRole('PROPIETARIO','ADMINISTRADOR','MULTIFUNCION','INVENTARIO')")
    public List<ExpenseMovementDto> movements(
            @PathVariable Long clientId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            Authentication auth) {

        validateClient(clientId, auth);
        return svc.findMovements(clientId, from, to);
    }
}
