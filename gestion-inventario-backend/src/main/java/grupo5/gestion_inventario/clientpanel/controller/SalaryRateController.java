// src/main/java/grupo5/gestion_inventario/clientpanel/controller/SalaryRateController.java
package grupo5.gestion_inventario.clientpanel.controller;

import grupo5.gestion_inventario.clientpanel.model.SalaryRate;
import grupo5.gestion_inventario.model.Client;
import grupo5.gestion_inventario.model.Employee;
import grupo5.gestion_inventario.model.EmployeeRole;
import grupo5.gestion_inventario.model.Sucursal;
import grupo5.gestion_inventario.repository.EmployeeRepository;
import grupo5.gestion_inventario.repository.SucursalRepository;
import grupo5.gestion_inventario.service.SalaryRateService;
import java.math.BigDecimal;
import java.time.LocalDate;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/client-panel/{clientId}/sucursales/{sucursalId}/employees/{employeeId}/salary-rate")
@RequiredArgsConstructor
public class SalaryRateController {

    private final SalaryRateService rateSvc;
    private final EmployeeRepository employeeRepo;
    private final SucursalRepository sucursalRepo;

    /** Petición JSON */
    public record SalaryRateRequest(
            BigDecimal hourlyRate,
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate effectiveFrom
    ) {}

    /* ---------- Validación de acceso (actor) ---------- */
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

    /* ---------- Validar empleado objetivo pertenece a la sucursal ---------- */
    private Employee validateTargetEmployee(Long clientId, Long sucursalId, Long employeeId) {
        Employee target = employeeRepo.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Empleado objetivo no encontrado"));

        if (!target.getClient().getId().equals(clientId)) {
            throw new AccessDeniedException("El empleado no pertenece al cliente");
        }
        if (target.getRole() == EmployeeRole.PROPIETARIO) {
            throw new AccessDeniedException("No se asigna tarifa al PROPIETARIO");
        }
        if (target.getSucursal() == null || !target.getSucursal().getId().equals(sucursalId)) {
            throw new AccessDeniedException("El empleado no pertenece a la sucursal indicada");
        }
        return target;
    }

    /** Fijar tarifa horaria de un empleado de la sucursal */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('PROPIETARIO','ADMINISTRADOR','MULTIFUNCION')")
    public SalaryRate setRate(@PathVariable Long clientId,
                              @PathVariable Long sucursalId,
                              @PathVariable Long employeeId,
                              @RequestBody SalaryRateRequest body,
                              Authentication auth) {

        validateAccess(clientId, sucursalId, auth);
        validateTargetEmployee(clientId, sucursalId, employeeId);

        // Service sin cambios
        return rateSvc.setHourlyRate(employeeId, body.hourlyRate(), body.effectiveFrom());
    }
}
