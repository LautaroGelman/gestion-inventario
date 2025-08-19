// src/main/java/grupo5/gestion_inventario/clientpanel/controller/ExpenseCategoryController.java
package grupo5.gestion_inventario.clientpanel.controller;

import grupo5.gestion_inventario.clientpanel.dto.CategoryCreateDto;
import grupo5.gestion_inventario.clientpanel.dto.CategoryUpdateDto;
import grupo5.gestion_inventario.clientpanel.dto.ExpenseCategoryDto;
import grupo5.gestion_inventario.model.Client;
import grupo5.gestion_inventario.model.Employee;
import grupo5.gestion_inventario.repository.EmployeeRepository;
import grupo5.gestion_inventario.service.ExpenseCategoryService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/client-panel/{clientId}/categories")
@RequiredArgsConstructor
public class ExpenseCategoryController {

    private final ExpenseCategoryService svc;
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

    /** Listar categorías activas */
    @GetMapping
    @PreAuthorize("hasAnyRole('PROPIETARIO','ADMINISTRADOR','CAJERO','VENTAS_INVENTARIO','MULTIFUNCION','INVENTARIO')")
    public List<ExpenseCategoryDto> list(@PathVariable Long clientId, Authentication auth) {
        validateClient(clientId, auth);
        return svc.listActive(clientId);
    }

    /** Crear nueva categoría */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('PROPIETARIO','ADMINISTRADOR','MULTIFUNCION','INVENTARIO')")
    public ExpenseCategoryDto create(@PathVariable Long clientId,
                                     @RequestBody CategoryCreateDto dto,
                                     Authentication auth) {
        validateClient(clientId, auth);
        return svc.create(clientId, dto);
    }

    /** Actualizar nombre / default */
    @PatchMapping("/{id}")
    @PreAuthorize("hasAnyRole('PROPIETARIO','ADMINISTRADOR','MULTIFUNCION','INVENTARIO')")
    public ExpenseCategoryDto update(@PathVariable Long clientId,
                                     @PathVariable Long id,
                                     @RequestBody CategoryUpdateDto dto,
                                     Authentication auth) {
        validateClient(clientId, auth);
        return svc.update(clientId, id, dto);
    }

    /** Desactivar (soft-delete) */
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @PreAuthorize("hasAnyRole('PROPIETARIO','ADMINISTRADOR','MULTIFUNCION','INVENTARIO')")
    public void deactivate(@PathVariable Long clientId,
                           @PathVariable Long id,
                           Authentication auth) {
        validateClient(clientId, auth);
        svc.deactivate(clientId, id);
    }
}
