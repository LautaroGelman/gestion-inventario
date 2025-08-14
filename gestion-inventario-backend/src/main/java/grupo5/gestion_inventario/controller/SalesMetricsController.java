// backend/src/main/java/grupo5/gestion_inventario/controller/SalesMetricsController.java
package grupo5.gestion_inventario.controller;

import grupo5.gestion_inventario.clientpanel.dto.SalesDailySummaryDto;
import grupo5.gestion_inventario.model.*;
import grupo5.gestion_inventario.repository.EmployeeRepository;
import grupo5.gestion_inventario.repository.SucursalRepository;
import grupo5.gestion_inventario.service.SalesService;
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
        "/api/client-panel/{clientId}/sucursales/{sucursalId}/sales")
@PreAuthorize(
        "hasAnyRole('PROPIETARIO','ADMINISTRADOR','CAJERO','MULTIFUNCION','INVENTARIO','VENTAS_INVENTARIO')")
public class SalesMetricsController {

    private final SalesService       salesService;
    private final EmployeeRepository employeeRepo;
    private final SucursalRepository sucursalRepo;

    public SalesMetricsController(SalesService       salesService,
                                  EmployeeRepository employeeRepo,
                                  SucursalRepository sucursalRepo) {
        this.salesService = salesService;
        this.employeeRepo = employeeRepo;
        this.sucursalRepo = sucursalRepo;
    }

    /* --------------------------------------------------------
     *  Helper: validación de acceso a la sucursal
     * -------------------------------------------------------- */
    private void validateAccess(Long clientId,
                                Long sucursalId,
                                Authentication auth) {

        Employee emp = employeeRepo.findByEmail(auth.getName())
                .orElseThrow(() ->
                        new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Empleado no encontrado"));

        if (!emp.getClient().getId().equals(clientId)) {
            throw new AccessDeniedException("Cliente no autorizado");
        }

        Sucursal sucursal = sucursalRepo.findById(sucursalId)
                .orElseThrow(() ->
                        new ResponseStatusException(HttpStatus.NOT_FOUND, "Sucursal no encontrada"));

        if (!sucursal.getClient().getId().equals(clientId)) {
            throw new AccessDeniedException("La sucursal no pertenece al cliente");
        }

        boolean propietario = emp.getRole() == EmployeeRole.PROPIETARIO;

        if (!propietario) {
            if (emp.getSucursal() == null ||
                    !emp.getSucursal().getId().equals(sucursalId)) {
                throw new AccessDeniedException("No autorizado para esta sucursal");
            }
        }
    }

    /* --------------------------------------------------------
     *  Resumen de ventas diarias (últimos N días)
     * -------------------------------------------------------- */
    @GetMapping("/summary")
    public ResponseEntity<List<SalesDailySummaryDto>> getSummary(
            @PathVariable Long clientId,
            @PathVariable Long sucursalId,
            @RequestParam(defaultValue = "30") int days,
            Authentication auth) {

        validateAccess(clientId, sucursalId, auth);

        List<SalesDailySummaryDto> summary =
                salesService.summaryLastDays(sucursalId, days);

        return ResponseEntity.ok(summary);
    }
}
