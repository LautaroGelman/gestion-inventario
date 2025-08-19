// src/main/java/grupo5/gestion_inventario/clientpanel/controller/ExpenseTemplateController.java
package grupo5.gestion_inventario.clientpanel.controller;

import grupo5.gestion_inventario.clientpanel.dto.TemplateCreateDto;
import grupo5.gestion_inventario.clientpanel.dto.TemplateUpdateDto;
import grupo5.gestion_inventario.clientpanel.model.ExpenseTemplate;
import grupo5.gestion_inventario.model.Client;
import grupo5.gestion_inventario.model.Employee;
import grupo5.gestion_inventario.repository.EmployeeRepository;
import grupo5.gestion_inventario.service.ExpenseTemplateService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/client-panel/{clientId}/templates")
@RequiredArgsConstructor
public class ExpenseTemplateController {

    private final ExpenseTemplateService tplSvc;
    private final EmployeeRepository employeeRepo;

    /* ---------- Validación de pertenencia al cliente (patrón actual) ---------- */
    private Client validateClient(Long clientId, Authentication auth) {
        Employee emp = employeeRepo.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("Empleado no encontrado"));
        Client client = emp.getClient();
        if (!client.getId().equals(clientId)) {
            throw new AccessDeniedException("No autorizado para este cliente");
        }
        return client;
    }

    /** Listar plantillas del cliente (opcional filtrado simple) */
    @GetMapping
    @PreAuthorize("hasAnyRole('PROPIETARIO','ADMINISTRADOR','CAJERO','VENTAS_INVENTARIO','MULTIFUNCION','INVENTARIO')")
    public List<ExpenseTemplate> list(@PathVariable Long clientId, Authentication auth) {
        validateClient(clientId, auth);
        // podrías exponer un DTO; aquí devolvemos la entidad como en tu versión
        return tplSvc.findByClient(clientId);
    }

    /** Crear plantilla */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('PROPIETARIO','ADMINISTRADOR','MULTIFUNCION','INVENTARIO')")
    public ExpenseTemplate create(@PathVariable Long clientId,
                                  @RequestBody TemplateCreateDto dto,
                                  Authentication auth) {
        validateClient(clientId, auth);
        return tplSvc.create(clientId, dto);
    }

    /** Actualizar plantilla */
    @PatchMapping("/{id}")
    @PreAuthorize("hasAnyRole('PROPIETARIO','ADMINISTRADOR','MULTIFUNCION','INVENTARIO')")
    public ExpenseTemplate update(@PathVariable Long clientId,
                                  @PathVariable Long id,
                                  @RequestBody TemplateUpdateDto dto,
                                  Authentication auth) {
        validateClient(clientId, auth);
        return tplSvc.update(clientId, id, dto);
    }

    /** Eliminar plantilla */
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAnyRole('PROPIETARIO','ADMINISTRADOR','MULTIFUNCION','INVENTARIO')")
    public void delete(@PathVariable Long clientId,
                       @PathVariable Long id,
                       Authentication auth) {
        validateClient(clientId, auth);
        tplSvc.delete(clientId, id);
    }
}

