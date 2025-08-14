// backend/src/main/java/grupo5/gestion_inventario/clientpanel/controller/ClientEmployeeController.java
package grupo5.gestion_inventario.clientpanel.controller;

import grupo5.gestion_inventario.clientpanel.dto.*;
import grupo5.gestion_inventario.model.*;
import grupo5.gestion_inventario.repository.EmployeeRepository;
import grupo5.gestion_inventario.repository.SucursalRepository;
import grupo5.gestion_inventario.service.EmployeeService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping(
        "/api/client-panel/{clientId}/sucursales/{sucursalId}/employees")
@PreAuthorize("hasAnyRole('PROPIETARIO','ADMINISTRADOR')")
public class ClientEmployeeController {

    private final EmployeeService     employeeService;
    private final EmployeeRepository  employeeRepo;
    private final SucursalRepository  sucursalRepo;

    public ClientEmployeeController(EmployeeService    employeeService,
                                    EmployeeRepository employeeRepo,
                                    SucursalRepository sucursalRepo) {
        this.employeeService = employeeService;
        this.employeeRepo    = employeeRepo;
        this.sucursalRepo    = sucursalRepo;
    }

    /* --------------- Validación de acceso --------------- */
    private void validateAccess(Long clientId,
                                Long sucursalId,
                                Authentication auth) {

        Employee me = employeeRepo.findByEmail(auth.getName())
                .orElseThrow(() ->
                        new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Empleado no encontrado"));

        if (!me.getClient().getId().equals(clientId)) {
            throw new AccessDeniedException("Cliente no autorizado");
        }

        Sucursal sucursal = sucursalRepo.findById(sucursalId)
                .orElseThrow(() ->
                        new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Sucursal no encontrada"));

        if (!sucursal.getClient().getId().equals(clientId)) {
            throw new AccessDeniedException("La sucursal no pertenece al cliente");
        }

        boolean propietario = me.getRole() == EmployeeRole.PROPIETARIO;
        if (!propietario) {            // es ADMINISTRADOR
            if (me.getSucursal() == null ||
                    !me.getSucursal().getId().equals(sucursalId)) {
                throw new AccessDeniedException("No autorizado para esta sucursal");
            }
        }
    }

    /* --------------- Listar --------------- */
    @GetMapping
    public List<EmployeeDto> list(
            @PathVariable Long clientId,
            @PathVariable Long sucursalId,
            Authentication   auth) {

        validateAccess(clientId, sucursalId, auth);
        return employeeService.findBySucursalId(sucursalId);
    }

    /* --------------- Crear --------------- */
    @PostMapping
    public EmployeeDto create(
            @PathVariable Long clientId,
            @PathVariable Long sucursalId,
            @RequestBody   CreateEmployeeRequest req,
            Authentication auth) {

        validateAccess(clientId, sucursalId, auth);
        return employeeService.create(clientId, sucursalId, req);
    }

    /* --------------- Actualizar --------------- */
    @PutMapping("/{id}")
    public EmployeeDto update(
            @PathVariable Long clientId,
            @PathVariable Long sucursalId,
            @PathVariable Long id,
            @RequestBody   UpdateEmployeeRequest req,
            Authentication auth) {

        validateAccess(clientId, sucursalId, auth);
        return employeeService.update(clientId, sucursalId, id, req);
    }

    /* --------------- Eliminar --------------- */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long clientId,
            @PathVariable Long sucursalId,
            @PathVariable Long id,
            Authentication auth) {

        validateAccess(clientId, sucursalId, auth);
        employeeService.delete(clientId, id);
        return ResponseEntity.noContent().build();
    }
}
