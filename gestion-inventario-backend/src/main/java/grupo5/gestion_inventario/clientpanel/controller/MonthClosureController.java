// src/main/java/grupo5/gestion_inventario/clientpanel/controller/MonthClosureController.java
package grupo5.gestion_inventario.clientpanel.controller;

import grupo5.gestion_inventario.model.Client;
import grupo5.gestion_inventario.model.Employee;
import grupo5.gestion_inventario.repository.EmployeeRepository;
import grupo5.gestion_inventario.service.MonthClosureService;
import java.time.YearMonth;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/client-panel/{clientId}/finance/close-month")
@RequiredArgsConstructor
public class MonthClosureController {

    private final MonthClosureService closeSvc;
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

    @PostMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAnyRole('PROPIETARIO','ADMINISTRADOR','MULTIFUNCION','INVENTARIO')")
    public void close(@PathVariable Long clientId,
                      @RequestParam int year,
                      @RequestParam int month,
                      Authentication auth) {

        validateClient(clientId, auth);

        if (month < 1 || month > 12) {
            throw new RuntimeException("Mes inválido (1-12)");
        }
        // puedes agregar validación de rango de year si lo deseas
        closeSvc.closeMonth(clientId, YearMonth.of(year, month));
    }
}
