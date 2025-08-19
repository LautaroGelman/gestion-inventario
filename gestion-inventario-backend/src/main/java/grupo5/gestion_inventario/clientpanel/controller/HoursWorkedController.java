// src/main/java/grupo5/gestion_inventario/clientpanel/controller/HoursWorkedController.java
package grupo5.gestion_inventario.clientpanel.controller;

import java.math.BigDecimal;

import grupo5.gestion_inventario.clientpanel.model.HoursWorked;
import grupo5.gestion_inventario.model.Client;
import grupo5.gestion_inventario.model.Employee;
import grupo5.gestion_inventario.model.EmployeeRole;
import grupo5.gestion_inventario.model.Sucursal;
import grupo5.gestion_inventario.repository.EmployeeRepository;
import grupo5.gestion_inventario.repository.SucursalRepository;
import grupo5.gestion_inventario.service.HoursWorkedService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/client-panel/{clientId}/sucursales/{sucursalId}/employees/{employeeId}/hours-worked")
@RequiredArgsConstructor
public class HoursWorkedController {

    private final HoursWorkedService hwSvc;
    private final EmployeeRepository employeeRepo;
    private final SucursalRepository sucursalRepo;

    /** Petición JSON simple */
    public record HoursWorkedRequest(int year, int month, BigDecimal hours) {}

    /* ---------- Validación de acceso (patrón actual) ---------- */
    private Sucursal validateAccess(Long clientId, Long sucursalId, Authentication auth) {
        Employee authEmp = employeeRepo.findByEmail(auth.getName())
                .orElseThrow(() -> new RuntimeException("Empleado no encontrado"));

        Client client = authEmp.getClient();
        if (!client.getId().equals(clientId)) {
            throw new AccessDeniedException("No autorizado para este cliente");
        }

        Sucursal sucursal = sucursalRepo.findById(sucursalId)
                .orElseThrow(() -> new AccessDeniedException("Sucursal no encontrada"));

        if (!sucursal.getClient().getId().equals(clientId)) {
            throw new AccessDeniedException("La sucursal no pertenece al cliente");
        }

        boolean propietario = authEmp.getRole() == EmployeeRole.PROPIETARIO;
        if (!propietario) {
            if (authEmp.getSucursal() == null || !authEmp.getSucursal().getId().equals(sucursalId)) {
                throw new AccessDeniedException("No autorizado para esta sucursal");
            }
        }
        return sucursal;
    }

    /* ---------- Verifica que el empleado objetivo pertenezca a la sucursal ---------- */
    private Employee validateTargetEmployee(Long clientId, Long sucursalId, Long employeeId) {
        Employee target = employeeRepo.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Empleado objetivo no encontrado"));

        if (!target.getClient().getId().equals(clientId)) {
            throw new AccessDeniedException("El empleado no pertenece al cliente");
        }
        // El PROPIETARIO no tiene sucursal; por horas trabajadas, lo bloqueamos explícitamente.
        if (target.getRole() == EmployeeRole.PROPIETARIO) {
            throw new AccessDeniedException("No se registran horas para el PROPIETARIO");
        }
        if (target.getSucursal() == null || !target.getSucursal().getId().equals(sucursalId)) {
            throw new AccessDeniedException("El empleado no pertenece a la sucursal indicada");
        }
        return target;
    }

    /** Registrar horas trabajadas para el empleado de esa sucursal */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('PROPIETARIO','ADMINISTRADOR','MULTIFUNCION')")
    public HoursWorked record(@PathVariable Long clientId,
                              @PathVariable Long sucursalId,
                              @PathVariable Long employeeId,
                              @RequestBody HoursWorkedRequest body,
                              Authentication auth) {

        validateAccess(clientId, sucursalId, auth);
        validateTargetEmployee(clientId, sucursalId, employeeId);

        // No tocamos el service: misma firma
        return hwSvc.recordHours(employeeId, body.year(), body.month(), body.hours());
    }
}
