// backend/src/main/java/grupo5/gestion_inventario/clientpanel/controller/ClientSucursalController.java
package grupo5.gestion_inventario.clientpanel.controller;

import grupo5.gestion_inventario.clientpanel.dto.SucursalDto;
import grupo5.gestion_inventario.clientpanel.dto.SucursalRequest;
import grupo5.gestion_inventario.model.Employee;
import grupo5.gestion_inventario.model.EmployeeRole;
import grupo5.gestion_inventario.repository.EmployeeRepository;
import grupo5.gestion_inventario.service.SucursalService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/client-panel/{clientId}/sucursales")
@RequiredArgsConstructor
public class ClientSucursalController {

    private final SucursalService    sucursalSvc;
    private final EmployeeRepository employeeRepo;

    private void validateOwner(Long clientId, Authentication auth) {
        Employee emp = employeeRepo.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("Empleado no encontrado"));
        if (!emp.getClient().getId().equals(clientId)) {
            throw new AccessDeniedException("Cliente no autorizado");
        }
        if (emp.getRole() != EmployeeRole.PROPIETARIO) {
            throw new AccessDeniedException("Sólo PROPIETARIO puede gestionar sucursales");
        }
    }

    /** Listar sucursales del cliente */
    @GetMapping
    @PreAuthorize("hasAnyRole('PROPIETARIO','ADMINISTRADOR')") // listar también para admin si querés
    public List<SucursalDto> list(@PathVariable Long clientId, Authentication auth) {
        // Para listar podrías permitir ADMIN sin exigir PROPIETARIO estricto
        Employee emp = employeeRepo.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("Empleado no encontrado"));
        if (!emp.getClient().getId().equals(clientId)) {
            throw new AccessDeniedException("Cliente no autorizado");
        }
        return sucursalSvc.listByClient(clientId);
    }

    /** Crear sucursal (sólo PROPIETARIO) */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('PROPIETARIO')")
    public SucursalDto create(@PathVariable Long clientId,
                              @RequestBody SucursalRequest req,
                              Authentication auth) {
        validateOwner(clientId, auth);
        return sucursalSvc.create(clientId, req);
    }

    /** Editar sucursal (sólo PROPIETARIO) */
    @PutMapping("/{sucursalId}")
    @PreAuthorize("hasRole('PROPIETARIO')")
    public SucursalDto update(@PathVariable Long clientId,
                              @PathVariable Long sucursalId,
                              @RequestBody SucursalRequest req,
                              Authentication auth) {
        validateOwner(clientId, auth);
        return sucursalSvc.update(clientId, sucursalId, req);
    }

    /** Activar/Desactivar sucursal (sólo PROPIETARIO) */
    @PatchMapping("/{sucursalId}/active")
    @PreAuthorize("hasRole('PROPIETARIO')")
    public SucursalDto setActive(@PathVariable Long clientId,
                                 @PathVariable Long sucursalId,
                                 @RequestParam boolean active,
                                 Authentication auth) {
        validateOwner(clientId, auth);
        return sucursalSvc.setActive(clientId, sucursalId, active);
    }
}
