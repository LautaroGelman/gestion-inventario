// backend/src/main/java/grupo5/gestion_inventario/clientpanel/controller/ClientPanelController.java
package grupo5.gestion_inventario.clientpanel.controller;

import grupo5.gestion_inventario.clientpanel.dto.*;
import grupo5.gestion_inventario.model.*;
import grupo5.gestion_inventario.repository.EmployeeRepository;
import grupo5.gestion_inventario.repository.SucursalRepository;
import grupo5.gestion_inventario.service.ProductService;
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
        "/api/client-panel/{clientId}/sucursales/{sucursalId}")
@PreAuthorize(
        "hasAnyRole('PROPIETARIO','ADMINISTRADOR','CAJERO','MULTIFUNCION','INVENTARIO','VENTAS_INVENTARIO')")
public class ClientPanelController {

    private final EmployeeRepository employeeRepo;
    private final SucursalRepository sucursalRepo;
    private final ProductService     productService;
    private final SalesService       salesService;

    public ClientPanelController(EmployeeRepository employeeRepo,
                                 SucursalRepository sucursalRepo,
                                 ProductService     productService,
                                 SalesService       salesService) {
        this.employeeRepo    = employeeRepo;
        this.sucursalRepo    = sucursalRepo;
        this.productService  = productService;
        this.salesService    = salesService;
    }

    /* --------------------------------------------------------
     *  Helper de validación
     * -------------------------------------------------------- */
    private void validateAccess(Long clientId,
                                Long sucursalId,
                                Authentication auth) {

        Employee emp = employeeRepo.findByEmail(auth.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Empleado no encontrado"));

        if (!emp.getClient().getId().equals(clientId)) {
            throw new AccessDeniedException("Cliente no autorizado");
        }

        Sucursal sucursal = sucursalRepo.findById(sucursalId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sucursal no encontrada"));

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
     *  DASHBOARD
     * -------------------------------------------------------- */
    @GetMapping("/dashboard")
    public ResponseEntity<ClientDashboardDto> getDashboard(
            @PathVariable Long clientId,
            @PathVariable Long sucursalId,
            Authentication   auth) {

        validateAccess(clientId, sucursalId, auth);

        long lowStock   = productService.countLowStock(sucursalId);
        long salesToday = salesService.countSalesToday(sucursalId);

        return ResponseEntity.ok(new ClientDashboardDto(lowStock, salesToday));
    }

    /* --------------------------------------------------------
     *  REPORTES
     * -------------------------------------------------------- */
    @GetMapping("/reports/daily-sales")
    public ResponseEntity<List<SalesDailySummaryDto>> getDailySales(
            @PathVariable Long clientId,
            @PathVariable Long sucursalId,
            @RequestParam(defaultValue = "30") int days,
            Authentication auth) {

        validateAccess(clientId, sucursalId, auth);
        return ResponseEntity.ok(salesService.summaryLastDays(sucursalId, days));
    }

    @GetMapping("/reports/profitability")
    public ResponseEntity<List<ProfitabilitySummaryDto>> getProfitability(
            @PathVariable Long clientId,
            @PathVariable Long sucursalId,
            @RequestParam(defaultValue = "30") int days,
            Authentication auth) {

        validateAccess(clientId, sucursalId, auth);
        return ResponseEntity.ok(salesService.getProfitabilitySummaryLastDays(sucursalId, days));
    }

    @GetMapping("/reports/sales-by-employee")
    public ResponseEntity<List<SalesByEmployeeDTO>> getSalesByEmployee(
            @PathVariable Long clientId,
            @PathVariable Long sucursalId,
            @RequestParam String startDate,
            @RequestParam String endDate,
            Authentication auth) {

        validateAccess(clientId, sucursalId, auth);
        return ResponseEntity.ok(
                salesService.getSalesByEmployee(sucursalId, startDate, endDate));
    }
}
